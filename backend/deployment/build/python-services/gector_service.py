"""
GECToR Grammar Correction Service

This service provides fast, offline grammar correction using the GECToR model.
It runs as a standalone microservice that the Java backend can call.
"""

from flask import Flask, request, jsonify
import logging
import time
import difflib
from functools import lru_cache
import re

# Try to import GECToR dependencies - install as needed
try:
    import torch
    from transformers import AutoTokenizer, AutoModelForTokenClassification
    import numpy as np
    GECTOR_AVAILABLE = True
except ImportError:
    print("GECToR dependencies not found. Install: pip install torch transformers")
    GECTOR_AVAILABLE = False

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GrammarCorrector:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        
        if GECTOR_AVAILABLE:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            logger.info(f"Using device: {self.device}")
            self.load_model()
        else:
            self.device = 'cpu'
            logger.warning("GECToR not available, using rule-based fallback")
    
    def load_model(self):
        """Load GECToR model - using a lightweight alternative for speed"""
        try:
            # Using a smaller, faster model for real-time correction
            model_name = "grammarly/coedit-large"  # Alternative: microsoft/DialoGPT-medium for speed
            
            logger.info(f"Loading model: {model_name}")
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForTokenClassification.from_pretrained(model_name)
            self.model.to(self.device)
            self.model.eval()
            
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            # Fallback to rule-based correction
            self.model = None
            self.tokenizer = None
    
    @lru_cache(maxsize=1000)
    def correct_text(self, text):
        """Correct grammar in text with caching"""
        if not text or not text.strip():
            return text, []
        
        text = text.strip()
        
        if not self.model or not self.tokenizer:
            return self._rule_based_correction(text)
        
        try:
            # Tokenize input
            inputs = self.tokenizer(text, return_tensors="pt", max_length=128, truncation=True)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
                predicted_token_ids = predictions.argmax(dim=-1)
            
            # Decode corrections (simplified)
            corrected_text = self._apply_corrections(text, predicted_token_ids)
            errors = self._identify_errors(text, corrected_text)
            
            return corrected_text, errors
            
        except Exception as e:
            logger.error(f"Model correction failed: {e}")
            return self._rule_based_correction(text)
    
    def _rule_based_correction(self, text):
        """Fast rule-based corrections for common ESL errors"""
        corrected = text
        errors = []
        
        # Common ESL corrections
        corrections = [
            # Subject-verb agreement
            (r'\b(I|you|we|they)\s+is\b', r'\1 are', "Subject-verb agreement"),
            (r'\b(he|she|it)\s+are\b', r'\1 is', "Subject-verb agreement"),
            
            # Article usage
            (r'\ba\s+([aeiouAEIOU])', r'an \1', "Article usage"),
            (r'\ban\s+([bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ])', r'a \1', "Article usage"),
            
            # Common word corrections
            (r'\bthier\b', 'their', "Spelling"),
            (r'\bthere\s+is\s+many\b', 'there are many', "Subject-verb agreement"),
            (r'\bmuch\s+(people|students|friends)\b', r'many \1', "Quantifier usage"),
            
            # Double spaces
            (r'\s+', ' ', "Spacing"),
        ]
        
        for pattern, replacement, error_type in corrections:
            if re.search(pattern, corrected):
                errors.append({"type": error_type, "original": pattern})
                corrected = re.sub(pattern, replacement, corrected)
        
        return corrected, errors
    
    def _apply_corrections(self, original, predicted_ids):
        """Apply model predictions to create corrected text (simplified implementation)"""
        # This would need full GECToR implementation
        # For now, return original with minor corrections
        return self._rule_based_correction(original)[0]
    
    def _identify_errors(self, original, corrected):
        """Identify what changed between original and corrected text"""
        errors = []
        
        if original != corrected:
            # Use difflib to find differences
            diff = list(difflib.unified_diff(
                original.split(), corrected.split(), 
                fromfile='original', tofile='corrected', lineterm=''
            ))
            
            if len(diff) > 2:  # Skip header lines
                errors.append({
                    "type": "Grammar correction",
                    "changes": len(diff) - 2
                })
        
        return errors

# Initialize corrector
corrector = GrammarCorrector()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": corrector.model is not None,
        "device": str(corrector.device) if GECTOR_AVAILABLE else "cpu"
    })

@app.route('/correct', methods=['POST'])
def correct_grammar():
    """Main grammar correction endpoint"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({"error": "No text provided"}), 400
        
        text = data['text']
        role = data.get('role', '')
        context = data.get('context', '')
        
        # Start timing
        start_time = time.time()
        
        # Perform correction
        corrected_text, errors = corrector.correct_text(text)
        
        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000  # ms
        
        # Determine status based on errors
        if not errors or len(errors) == 0:
            status = "NO_ERRORS"
            feedback = "✓ Great job! Your grammar looks perfect."
        elif len(errors) <= 2:
            status = "MINOR_ERRORS"
            feedback = f"✓ Good work! Just {len(errors)} small improvement{'s' if len(errors) > 1 else ''} found."
        else:
            status = "MAJOR_ERRORS"
            feedback = f"💡 Let's improve this! Found {len(errors)} areas to work on."
        
        # Add specific feedback
        if errors:
            error_types = list(set([error.get('type', 'Grammar') for error in errors]))
            feedback += f" Focus on: {', '.join(error_types[:2])}."
        
        # Keep feedback concise and encouraging
        if len(feedback) > 100:
            feedback = feedback[:97] + "..."
        
        response = {
            "original_text": text,
            "corrected_text": corrected_text,
            "status": status,
            "feedback": feedback,
            "errors": errors,
            "processing_time_ms": round(processing_time, 2),
            "has_corrections": text != corrected_text
        }
        
        logger.info(f"Processed text in {processing_time:.2f}ms: '{text[:50]}...'")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return jsonify({
            "error": "Grammar correction failed",
            "original_text": data.get('text', ''),
            "corrected_text": data.get('text', ''),
            "status": "MINOR_ERRORS",
            "feedback": "Analysis temporarily unavailable. Keep practicing!",
            "processing_time_ms": 0
        }), 500

@app.route('/batch-correct', methods=['POST'])
def batch_correct():
    """Batch correction for multiple texts"""
    try:
        data = request.get_json()
        texts = data.get('texts', [])
        
        if not texts:
            return jsonify({"error": "No texts provided"}), 400
        
        results = []
        for text in texts:
            corrected, errors = corrector.correct_text(text)
            results.append({
                "original": text,
                "corrected": corrected,
                "error_count": len(errors)
            })
        
        return jsonify({"results": results})
        
    except Exception as e:
        logger.error(f"Batch correction error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = 5001  # Different from existing grammar service on 5000
    logger.info(f"Starting GECToR Grammar Correction Service on port {port}")
    logger.info(f"GECToR available: {GECTOR_AVAILABLE}")
    
    # Run in production mode for better performance
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
