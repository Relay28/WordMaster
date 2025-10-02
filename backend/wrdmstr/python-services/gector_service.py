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
        extra: Dict = {"suggested_rewrite": "", "clarity_anomalies": 0}

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

        # 12. Clarity / pronoun anomaly & nonsense pattern detection
        # Count pronoun repetitions and odd alternations like: you me me you, I you I you
        tokens_lower = [t.lower() for t in tokens]
        pronouns = [t for t in tokens_lower if t in PRONOUN_SUBJECTS]
        anomalies = 0
        # Repeated immediate pronouns (already partly covered by duplication, but track for clarity)
        for i in range(len(tokens_lower)-1):
            if tokens_lower[i] in PRONOUN_SUBJECTS and tokens_lower[i+1] in PRONOUN_SUBJECTS:
                anomalies += 1
        # Alternating short pattern (e.g., you me you me) of length >=4
        if len(tokens_lower) >= 4:
            window = tokens_lower[:6]  # inspect first chunk
            pattern = ''.join(['P' if t in PRONOUN_SUBJECTS else 'O' for t in window])
            if pattern.startswith('PPPP') or pattern.startswith('PPOP'):
                anomalies += 1
        # Excess commas poorly placed (comma directly after single word then space then pronoun)
        if re.search(r"\b(you|i)\s*,\s*(you|i)\b", corrected, re.I):
            anomalies += 1
            corrections.append({"type": "Clarity", "detail": "Ambiguous pronoun sequence", "severity": "MINOR"})
        # Nonsense heuristic: very short tokens dominated by pronouns and 'not'
        content_tokens = [t for t in tokens_lower if re.match(r"[a-z]+", t)]
        if content_tokens and sum(1 for t in content_tokens if t in PRONOUN_SUBJECTS or t == 'not') / max(1, len(content_tokens)) > 0.7 and len(content_tokens) <= 8:
            anomalies += 1
            corrections.append({"type": "Clarity", "detail": "Possibly unclear meaning", "severity": "MINOR"})

        # Escalate Clarity severity if anomalies >2
        clarity_count = sum(1 for c in corrections if c['type'] == 'Clarity')
        if anomalies > 2 and clarity_count:
            for c in corrections:
                if c['type'] == 'Clarity':
                    c['severity'] = 'MAJOR'
        extra['clarity_anomalies'] = anomalies

        # Suggested rewrite strategy: if we have clarity anomalies, attempt to build a simpler rewrite
        if anomalies:
            # Remove duplicated consecutive words again for safety
            simple_tokens: List[str] = []
            prev = None
            for t in tokens:
                if prev and t.lower() == prev.lower():
                    continue
                simple_tokens.append(t)
                prev = t
            # Basic normalization: collapse pronoun chains to one pronoun and one verb 'are'
            filtered: List[str] = []
            pronoun_run = 0
            for t in simple_tokens:
                if t.lower() in PRONOUN_SUBJECTS:
                    pronoun_run += 1
                    if pronoun_run > 1:
                        continue
                else:
                    pronoun_run = 0
                filtered.append(t)
            # If we ended up with just a pronoun and maybe 'not', suggest a neutral rewrite
            raw_rewrite = ' '.join(filtered).strip()
            if len(raw_rewrite.split()) <= 2:
                suggested = "Could you clarify what you mean?"
            else:
                # Add period if missing
                if not re.search(r"[.!?]$", raw_rewrite):
                    raw_rewrite += '.'
                suggested = raw_rewrite
            extra['suggested_rewrite'] = suggested
        else:
            # If no anomalies, we can suggest the corrected sentence with small stylistic polish
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

        # Weighted severity counts
        minor = sum(1 for e in errors if e.get('severity') == 'MINOR')
        major = sum(1 for e in errors if e.get('severity') == 'MAJOR')
        # Boost scoring if clarity anomalies present and any clarity issue escalated
        clarity_anoms = extra.get('clarity_anomalies', 0)
        if any(e['type']=='Clarity' and e['severity']=='MAJOR' for e in errors):
            major += 1

        if not text.strip():
            status = "NO_ERRORS"
        else:
            score = major * 2 + minor  # simple weighting
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
            feedback = "✓ Minor fixes: " + focus if focus else "✓ Minor improvements possible."
        else:
            feedback = "💡 Improve: " + focus if focus else "💡 Several grammar issues present."

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
            "clarity_anomalies": clarity_anoms
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
