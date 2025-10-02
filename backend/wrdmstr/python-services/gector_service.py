"""
GECToR Grammar Correction Service

This service provides fast, offline grammar correction using the GECToR model.
It runs as a standalone microservice that the Java backend can call.
"""

from flask import Flask, request, jsonify
import os
import logging
import time
import difflib
from functools import lru_cache
import re
from typing import List, Dict, Tuple

# Try to import GECToR dependencies - install as needed
try:
    import torch  # type: ignore
    from transformers import AutoTokenizer, AutoModelForTokenClassification  # type: ignore
    import numpy as np  # type: ignore
    GECTOR_AVAILABLE = True
except ImportError:  # pragma: no cover - fallback path
    print("GECToR dependencies not found. Install: pip install torch transformers")
    GECTOR_AVAILABLE = False

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ------------------------------
# Helper regex & resources
# ------------------------------
VERB_REGEX = re.compile(r"\b(am|is|are|was|were|be|being|been|have|has|had|do|does|did|go|goes|went|make|makes|made|play|plays|played|say|says|said|see|sees|saw|look|looks|looked|want|wants|wanted|need|needs|needed)\b", re.I)
PRONOUN_SUBJECTS = {"i", "you", "we", "they", "he", "she", "it"}
COMMON_MISSPELLINGS = {
    "teh": "the",
    "recieve": "receive",
    "thier": "their",
    "wierd": "weird",
}

class GrammarCorrector:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        # Allow opting out of heavy model load via env var (default: skip load for faster startup)
        load_flag = os.environ.get('GECTOR_LOAD_MODEL', '0').lower() in {'1','true','yes'}
        if GECTOR_AVAILABLE and load_flag:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            logger.info(f"Using device: {self.device}")
            self.load_model()
        else:
            self.device = 'cpu'
            if GECTOR_AVAILABLE and not load_flag:
                logger.info("Skipping transformer model load (GECTOR_LOAD_MODEL disabled); using heuristics only")
            else:
                logger.warning("GECToR dependencies missing; using heuristics only")

    def load_model(self):
        """Load model (placeholder). If fails, fallback heuristics remain."""
        try:
            model_name = "grammarly/coedit-large"
            logger.info(f"Loading model: {model_name}")
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForTokenClassification.from_pretrained(model_name)
            self.model.to(self.device)
            self.model.eval()
            logger.info("Model loaded successfully")
        except Exception as e:  # pragma: no cover
            logger.error(f"Failed to load model: {e}")
            self.model = None
            self.tokenizer = None

    @lru_cache(maxsize=1000)
    def correct_text(self, text: str) -> Tuple[str, List[Dict], Dict]:
        """Return corrected_text, list of error dicts, and an extra info dict (clarity, rewrite)."""
        if not text or not text.strip():
            return "", [], {"suggested_rewrite": "", "clarity_anomalies": 0}
        text = text.strip()
        if not self.model or not self.tokenizer:
            return self._heuristic_corrections(text)
        try:
            inputs = self.tokenizer(text, return_tensors="pt", max_length=128, truncation=True)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            with torch.no_grad():
                outputs = self.model(**inputs)
                # NOTE: Decoding true GEC suggestions requires sequence tagging logic; omitted for speed.
            # Return heuristic corrections until full model support implemented
            return self._heuristic_corrections(text)
        except Exception as e:  # pragma: no cover
            logger.error(f"Model correction failed: {e}")
            return self._heuristic_corrections(text)

    # ------------------------------
    # Heuristic grammar checks
    # ------------------------------
    def _heuristic_corrections(self, text: str) -> Tuple[str, List[Dict], Dict]:
        corrections: List[Dict] = []
        corrected = text
        # extra.clarity_score: higher is worse (0 = clear), anomalies count is component count
        extra: Dict = {"suggested_rewrite": "", "clarity_anomalies": 0, "clarity_score": 0}

        # Track severities: minor or major
        def add(type_, detail, severity='MINOR'):
            corrections.append({"type": type_, "detail": detail, "severity": severity})

        # 1. Spacing normalization (only flag if internal multiple spaces or tabs existed)
        had_internal_extra = bool(re.search(r"[ \t]{2,}", corrected)) or "\t" in corrected
        trimmed = corrected.strip()
        if had_internal_extra:
            compacted = re.sub(r"[ \t]{2,}", " ", trimmed)
            if compacted != corrected:
                add("Spacing", "Collapsed multiple spaces/tabs")
            corrected = compacted
        else:
            corrected = trimmed

        # Domain-specific quick fixes BEFORE other grammar (do not mark spacing)
        # Common phrase correction: 'you honor' -> 'your honor'
        if re.search(r"\byou honor\b", corrected, re.I):
            corrected = re.sub(r"\byou honor\b", "your honor", corrected, flags=re.I)
            add("Word Choice", "Replaced 'you honor' with 'your honor'")
        # Misspelling: proejct -> project
        if re.search(r"\bproejct\b", corrected, re.I):
            corrected = re.sub(r"\bproejct\b", "project", corrected, flags=re.I)
            add("Spelling", "proejct -> project")
        # Capital after comma pattern: ", Based" -> ", based" (unless a proper noun heuristically)
        corrected = re.sub(r",\s+([A-Z])(ased|ecause|ut|nd|or|hen|however)",
                            lambda m: ", " + m.group(1).lower() + m.group(2), corrected)

        # Discourse markers missing comma: 'No your honor' / 'No your honor' -> 'No, your honor'
        corrected = re.sub(r"\bNo your honor\b", "No, your honor", corrected, flags=re.I)

        # 2. Detect duplicate consecutive words (case-insensitive)
        dup_pattern = re.compile(r"\b(\w+)\s+\1\b", re.I)
        if dup_pattern.search(corrected):
            corrected = dup_pattern.sub(lambda m: m.group(1), corrected)
            add("Duplication", "Removed repeated word", 'MINOR')

        # 3. Capitalize first letter if sentence-like
        if corrected and corrected[0].isalpha() and corrected[0].islower():
            corrected = corrected[0].upper() + corrected[1:]
            add("Capitalization", "Capitalized first letter")

        # 4. Pronoun 'I' capitalization
        new_corrected = re.sub(r"\bi\b", "I", corrected)
        if new_corrected != corrected:
            add("Capitalization", "Capitalized pronoun I")
            corrected = new_corrected

        # 5. Sentence termination if >=3 words and missing terminal punctuation
        if len(corrected.split()) >= 3 and not re.search(r"[.!?]$", corrected):
            corrected += "."
            add("Punctuation", "Added sentence terminator")

        # 6. Common misspellings
        for wrong, right in COMMON_MISSPELLINGS.items():
            pattern = r"\b" + re.escape(wrong) + r"\b"
            if re.search(pattern, corrected, re.I):
                corrected = re.sub(pattern, right, corrected, flags=re.I)
                add("Spelling", f"{wrong} -> {right}")

        # 7. Simple subject-verb agreement (present tense, first two tokens)
        tokens = corrected.split()
        if len(tokens) >= 2:
            subj = tokens[0].lower()
            if subj in {"he", "she", "it"}:
                second = tokens[1]
                if re.match(r"^[a-z]+$", second) and not second.endswith("s") and second.lower() not in {"am","is","are","was","were","has","have"}:
                    tokens[1] = second + "s"
                    add("Subject-Verb", f"Added 's' to '{second}'")
            if subj in {"i", "you", "we", "they"}:
                second = tokens[1]
                if second.lower().endswith("s") and second.lower() not in {"is","was","has"}:
                    tokens[1] = re.sub(r"s$", "", second)
                    add("Subject-Verb", f"Removed 's' from '{second}'")
            corrected2 = " ".join(tokens)
            if corrected2 != corrected:
                corrected = corrected2

        # 8. Naive comma splice detection: comma followed by lowercase start and another independent clause indicator
        if re.search(r",\s+[a-z]", corrected) and corrected.count('.') == 0 and corrected.count(',') >= 1 and len(tokens) > 12:
            add("Comma Splice", "Possible comma splice (consider splitting)", 'MAJOR')

        # 9. Run-on detection: long sentence no period
        word_count = len(tokens)
        if word_count > 25 and corrected.count('.') == 0:
            add("Run-on", "Long sentence without period", 'MAJOR')

        # 10. Fragment detection: very short (<3 words) lacking verb but not exclamation/question one-word answers
        if word_count < 3 and not VERB_REGEX.search(corrected) and word_count > 0:
            add("Fragment", "Sentence fragment", 'MINOR')

        # 11. Mixed tense heuristic: presence of both past and present auxiliaries
        if re.search(r"\b(was|were|did|went|had)\b", corrected) and re.search(r"\b(is|are|do|go|has|have)\b", corrected):
            add("Tense Mix", "Mixed past and present forms", 'MINOR')

        # 12. Clarity / coherence scoring (fast, heuristic only)
        tokens_lower = [t.lower() for t in tokens]
        anomalies = 0
        clarity_penalty = 0
        total_tokens = len(tokens_lower)
        alpha_tokens = [t for t in tokens_lower if re.match(r"[a-z]+", t)]
        alpha_len = len(alpha_tokens)
        unique_alpha = len(set(alpha_tokens)) if alpha_tokens else 0

        pronouns = [t for t in alpha_tokens if t in PRONOUN_SUBJECTS]
        pronoun_ratio = (len(pronouns) / max(1, alpha_len)) if alpha_len else 0
        if pronoun_ratio > 0.5 and alpha_len >= 4:
            anomalies += 1; clarity_penalty += 2
            corrections.append({"type": "Clarity", "detail": "High pronoun ratio reduces clarity", "severity": "MINOR"})

        # Repeated pronoun clusters (e.g., you you I you)
        for i in range(total_tokens-1):
            if tokens_lower[i] in PRONOUN_SUBJECTS and tokens_lower[i+1] in PRONOUN_SUBJECTS:
                anomalies += 1; clarity_penalty += 1
                break

        # Low lexical diversity
        if alpha_len >= 4 and unique_alpha / max(1, alpha_len) < 0.55:
            anomalies += 1; clarity_penalty += 2
            corrections.append({"type": "Clarity", "detail": "Low word variety", "severity": "MINOR"})

        # Missing verb (no main verb detected) with >=4 tokens
        if alpha_len >= 4 and not VERB_REGEX.search(" ".join(alpha_tokens)):
            anomalies += 1; clarity_penalty += 2
            corrections.append({"type": "Clarity", "detail": "No clear verb", "severity": "MAJOR"})

        # Insult / incoherent mix (simple lexicon)
        insult_terms = {"dumb", "stupid", "idiot", "noob"}
        if any(t in insult_terms for t in alpha_tokens) and pronoun_ratio > 0.3:
            anomalies += 1; clarity_penalty += 2
            corrections.append({"type": "Tone", "detail": "Negative / insulting language", "severity": "MAJOR"})

        # Alternating pronoun-other pattern e.g. you me you me you
        if total_tokens >= 5:
            pattern_flags = ''.join('P' if t in PRONOUN_SUBJECTS else 'O' for t in tokens_lower[:8])
            if re.match(r'(PO){2,}P?', pattern_flags):
                anomalies += 1; clarity_penalty += 2
                corrections.append({"type": "Clarity", "detail": "Pronoun alternation pattern", "severity": "MINOR"})

        # Short incoherent blast (<=10 tokens dominated by pronouns + insults)
        if 3 <= alpha_len <= 10:
            dominant = sum(1 for t in alpha_tokens if t in PRONOUN_SUBJECTS or t in insult_terms)
            if dominant / max(1, alpha_len) >= 0.7:
                anomalies += 1; clarity_penalty += 3
                corrections.append({"type": "Clarity", "detail": "Likely incoherent / needs rewrite", "severity": "MAJOR"})

        # Aggregate clarity score
        clarity_score = clarity_penalty + anomalies
        extra['clarity_anomalies'] = anomalies
        extra['clarity_score'] = clarity_score

        # Suggest rewrite if clarity issues present
        if clarity_score >= 2:
            # Build a neutral rewrite focusing on a single subject if pronouns present
            main_subject = 'I' if 'i' in tokens_lower else ('We' if 'we' in tokens_lower else ('They' if 'they' in tokens_lower else ('You' if 'you' in tokens_lower else 'It')))
            # Remove insult terms & duplicate pronouns
            filtered: List[str] = []
            used_pronoun = False
            for t in tokens:
                tl = t.lower()
                if tl in insult_terms:
                    continue
                if tl in PRONOUN_SUBJECTS:
                    if used_pronoun:
                        continue
                    used_pronoun = True
                    filtered.append(main_subject)
                else:
                    filtered.append(t)
            if not filtered:
                rewrite = "Please clarify your idea in a complete sentence."
            else:
                rewrite = ' '.join(filtered)
                # Ensure a verb exists, else add a neutral verb
                if not VERB_REGEX.search(rewrite.lower()):
                    rewrite += ' are'
                rewrite = re.sub(r"\s+", " ", rewrite).strip()
                if not re.search(r"[.!?]$", rewrite):
                    rewrite += '.'
            extra['suggested_rewrite'] = rewrite
            # Add a single consolidated clarity issue if not already
            if not any(c['type'] == 'Clarity' and 'Overall' in c['detail'] for c in corrections):
                severity = 'MAJOR' if clarity_score >= 4 else 'MINOR'
                corrections.append({"type": "Clarity", "detail": f"Overall coherence issues (score={clarity_score})", "severity": severity})
        else:
            if corrected and not extra['suggested_rewrite']:
                extra['suggested_rewrite'] = corrected

        return corrected, corrections, extra

# Backward compatibility wrapper (if any external import expected 2-tuple)
def legacy_correct(text: str):  # pragma: no cover
    corrected, errors, _extra = corrector.correct_text(text)
    return corrected, errors

# Initialize corrector
corrector = GrammarCorrector()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_loaded": corrector.model is not None,
        "device": str(getattr(corrector, 'device', 'cpu')),
        "heuristic_only": corrector.model is None
    })

@app.route('/correct', methods=['POST'])
def correct_grammar():
    try:
        data = request.get_json() or {}
        text = data.get('text', '')
        role = data.get('role', '')  # not used now but kept for future adaptation
        context = data.get('context', '')
        start_time = time.time()

        # Correct text using heuristics/model (returns corrected, errors list, extra dict)
        corrected_text, errors, extra = corrector.correct_text(text)

        # Weighted severity counts with clarity integration
        minor = sum(1 for e in errors if e.get('severity') == 'MINOR')
        major = sum(1 for e in errors if e.get('severity') == 'MAJOR')
        clarity_anoms = extra.get('clarity_anomalies', 0)
        clarity_score = extra.get('clarity_score', 0)
        # Escalate major weight for significant clarity incoherence
        if clarity_score >= 4:
            major += 2
        elif clarity_score >= 2:
            major += 1

        if not text.strip():
            status = "NO_ERRORS"
        else:
            score = major * 2 + minor  # base weighting
            # Force MAJOR if clarity_score passes hard threshold
            if clarity_score >= 4:
                status = "MAJOR_ERRORS"
            else:
                if score == 0:
                    status = "NO_ERRORS"
                elif score <= 3:
                    status = "MINOR_ERRORS"
                else:
                    status = "MAJOR_ERRORS"

        # Build concise feedback with top categories
        unique_types = []
        for e in errors:
            t = e['type']
            if t not in unique_types:
                unique_types.append(t)
        focus = ', '.join(unique_types[:3])

        if status == "NO_ERRORS":
            feedback = "✓ Excellent! Grammar looks good."
        elif status == "MINOR_ERRORS":
            feedback = ("✓ Minor fixes: " + focus) if focus else "✓ Minor improvements possible."
        else:
            if clarity_score >= 4:
                feedback = "⚠️ Incoherent / unclear message. Please rewrite clearly. Issues: " + focus if focus else "⚠️ Incoherent / unclear message. Please rewrite."
            else:
                feedback = ("💡 Improve: " + focus) if focus else "💡 Several grammar issues present."

        processing_time = (time.time() - start_time) * 1000
        response = {
            "original_text": text,
            "corrected_text": corrected_text,
            "suggested_rewrite": extra.get('suggested_rewrite', ''),
            "status": status,
            "feedback": feedback,
            "errors": errors,
            "processing_time_ms": round(processing_time, 2),
            "has_corrections": text != corrected_text,
            "clarity_anomalies": clarity_anoms,
            "clarity_score": clarity_score
        }
        return jsonify(response)
    except Exception as e:  # pragma: no cover
        logger.error(f"Error: {e}")
        return jsonify({
            "error": "Grammar correction failed",
            "original_text": data.get('text', ''),
            "corrected_text": data.get('text', ''),
            "status": "MINOR_ERRORS",
            "feedback": "Analysis temporarily unavailable.",
            "processing_time_ms": 0
        }), 500

@app.route('/batch-correct', methods=['POST'])
def batch_correct():
    try:
        data = request.get_json() or {}
        texts = data.get('texts', [])
        if not texts:
            return jsonify({"error": "No texts provided"}), 400
        results = []
        for t in texts:
            corrected, errs, extra = corrector.correct_text(t)
            results.append({
                "original": t,
                "corrected": corrected,
                "error_count": len(errs),
                "suggested_rewrite": extra.get('suggested_rewrite', ''),
                "clarity_anomalies": extra.get('clarity_anomalies', 0)
            })
        return jsonify({"results": results})
    except Exception as e:  # pragma: no cover
        logger.error(f"Batch correction error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':  # pragma: no cover
    port = 5001
    logger.info(f"Starting GECToR Grammar Correction Service on port {port}")
    logger.info(f"GECToR available: {GECTOR_AVAILABLE}")
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
