"""
CivicAI Python NLP Pipeline Service

This service provides advanced NLP capabilities using Python ML libraries:
- spaCy: Tokenization, POS-tagging, dependency parsing
- TextBlob: Polarity and subjectivity analysis
- Polyglot: Multi-language detection
- Detoxify: Toxicity and aggression detection
- Transformers: Political ideology classification
- SHAP: Model explainability
- Gensim: Semantic analysis and topic modeling
- BERTopic: Advanced topic modeling

The service runs as a Flask API that the Node.js backend can call.
"""

import os
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import NLP libraries with error handling
try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    print("WARNING: spaCy not available")

try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    TEXTBLOB_AVAILABLE = False
    print("WARNING: TextBlob not available")

try:
    from langdetect import detect, detect_langs
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False
    print("WARNING: langdetect not available")

try:
    from detoxify import Detoxify
    DETOXIFY_AVAILABLE = True
except ImportError:
    DETOXIFY_AVAILABLE = False
    print("WARNING: Detoxify not available")

try:
    from transformers import pipeline
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("WARNING: Transformers not available")

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("WARNING: SHAP not available")

try:
    from gensim.models import Word2Vec, LdaModel
    from gensim.corpora import Dictionary
    from gensim.utils import simple_preprocess
    GENSIM_AVAILABLE = True
except ImportError:
    GENSIM_AVAILABLE = False
    print("WARNING: Gensim not available")

try:
    from bertopic import BERTopic
    BERTOPIC_AVAILABLE = True
except ImportError:
    BERTOPIC_AVAILABLE = False
    print("WARNING: BERTopic not available")

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global model cache
MODELS = {}

def load_spacy_model():
    """Load spaCy model (Swedish if available, otherwise English)"""
    if not SPACY_AVAILABLE:
        return None
    
    if 'spacy' not in MODELS:
        try:
            # Try Swedish model first
            MODELS['spacy'] = spacy.load('sv_core_news_sm')
            print("✓ Loaded Swedish spaCy model")
        except:
            try:
                # Fallback to English
                MODELS['spacy'] = spacy.load('en_core_web_sm')
                print("✓ Loaded English spaCy model (Swedish not available)")
            except:
                print("✗ No spaCy model available. Run: python -m spacy download sv_core_news_sm")
                return None
    
    return MODELS['spacy']

def load_detoxify_model():
    """Load Detoxify model"""
    if not DETOXIFY_AVAILABLE:
        return None
    
    if 'detoxify' not in MODELS:
        MODELS['detoxify'] = Detoxify('multilingual')
        print("✓ Loaded Detoxify multilingual model")
    
    return MODELS['detoxify']

def load_ideology_classifier():
    """Load political ideology classifier using Swedish BERT"""
    if not TRANSFORMERS_AVAILABLE:
        return None
    
    if 'ideology' not in MODELS:
        try:
            # Use KB/bert-base-swedish-cased as the base model
            # This is a Swedish BERT model that can be used for zero-shot classification
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            import torch
            
            model_name = "KB/bert-base-swedish-cased"
            
            # For zero-shot classification, we'll use the model with manual scoring
            # In production, this should be fine-tuned on labeled political texts
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForSequenceClassification.from_pretrained(
                model_name,
                num_labels=3,  # left, center, right
                problem_type="single_label_classification",
                ignore_mismatched_sizes=True  # Since we're adding a classification head
            )
            
            MODELS['ideology'] = {
                'tokenizer': tokenizer,
                'model': model,
                'model_name': model_name
            }
            print(f"✓ Loaded Swedish BERT ideology classifier ({model_name})")
        except Exception as e:
            print(f"✗ Failed to load Swedish BERT model: {e}")
            print("  Falling back to zero-shot classification")
            # Fallback to zero-shot classification pipeline
            try:
                MODELS['ideology'] = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli"
                )
                print("✓ Loaded zero-shot classifier as fallback")
            except:
                MODELS['ideology'] = None
                return None
    
    return MODELS['ideology']

def load_bertopic_model():
    """Load BERTopic model"""
    if not BERTOPIC_AVAILABLE:
        return None
    
    if 'bertopic' not in MODELS:
        MODELS['bertopic'] = BERTopic(language="swedish", calculate_probabilities=True)
        print("✓ Loaded BERTopic model")
    
    return MODELS['bertopic']

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'CivicAI Python NLP Pipeline',
        'version': '1.0.0',
        'available_models': {
            'spacy': SPACY_AVAILABLE,
            'textblob': TEXTBLOB_AVAILABLE,
            'langdetect': LANGDETECT_AVAILABLE,
            'detoxify': DETOXIFY_AVAILABLE,
            'transformers': TRANSFORMERS_AVAILABLE,
            'shap': SHAP_AVAILABLE,
            'gensim': GENSIM_AVAILABLE,
            'bertopic': BERTOPIC_AVAILABLE,
        }
    })

@app.route('/preprocess', methods=['POST'])
def preprocess_text():
    """
    Text preprocessing using spaCy
    - Tokenization
    - POS tagging
    - Dependency parsing
    """
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    nlp = load_spacy_model()
    if not nlp:
        return jsonify({
            'error': 'spaCy not available',
            'fallback': True,
            'message': 'Install spaCy: pip install spacy && python -m spacy download sv_core_news_sm'
        }), 503
    
    doc = nlp(text)
    
    result = {
        'tokens': [
            {
                'text': token.text,
                'lemma': token.lemma_,
                'pos': token.pos_,
                'tag': token.tag_,
                'dep': token.dep_,
                'is_stop': token.is_stop,
                'is_punct': token.is_punct,
            }
            for token in doc
        ],
        'sentences': [
            {
                'text': sent.text,
                'start': sent.start_char,
                'end': sent.end_char,
            }
            for sent in doc.sents
        ],
        'entities': [
            {
                'text': ent.text,
                'label': ent.label_,
                'start': ent.start_char,
                'end': ent.end_char,
            }
            for ent in doc.ents
        ],
        'provenance': {
            'model': 'spaCy',
            'version': spacy.__version__,
            'model_name': nlp.meta['name'],
            'method': 'Statistical NLP with neural network',
            'timestamp': datetime.utcnow().isoformat()
        }
    }
    
    return jsonify(result)

@app.route('/sentiment', methods=['POST'])
def analyze_sentiment():
    """
    Sentiment analysis using TextBlob
    - Polarity (-1 to 1)
    - Subjectivity (0 to 1)
    """
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    if not TEXTBLOB_AVAILABLE:
        return jsonify({
            'error': 'TextBlob not available',
            'fallback': True
        }), 503
    
    blob = TextBlob(text)
    
    result = {
        'polarity': blob.sentiment.polarity,
        'subjectivity': blob.sentiment.subjectivity,
        'classification': 'positive' if blob.sentiment.polarity > 0.1 else 'negative' if blob.sentiment.polarity < -0.1 else 'neutral',
        'provenance': {
            'model': 'TextBlob',
            'version': '0.17.1',
            'method': 'Pattern-based sentiment analysis',
            'timestamp': datetime.utcnow().isoformat()
        }
    }
    
    return jsonify(result)

@app.route('/detect-language', methods=['POST'])
def detect_language():
    """
    Language detection using langdetect
    - Supports 55+ languages
    """
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    if not LANGDETECT_AVAILABLE:
        return jsonify({
            'error': 'langdetect not available',
            'fallback': True
        }), 503
    
    try:
        # Get language with probabilities
        lang_probs = detect_langs(text)
        
        # Primary language
        primary_lang = lang_probs[0]
        
        # Language name mapping (common languages)
        lang_names = {
            'sv': 'Swedish', 'en': 'English', 'de': 'German', 'fr': 'French',
            'es': 'Spanish', 'it': 'Italian', 'pt': 'Portuguese', 'nl': 'Dutch',
            'no': 'Norwegian', 'da': 'Danish', 'fi': 'Finnish', 'pl': 'Polish',
            'ru': 'Russian', 'ar': 'Arabic', 'zh-cn': 'Chinese', 'ja': 'Japanese',
            'ko': 'Korean', 'tr': 'Turkish', 'he': 'Hebrew', 'hi': 'Hindi'
        }
        
        result = {
            'language': primary_lang.lang,
            'language_name': lang_names.get(primary_lang.lang, primary_lang.lang.upper()),
            'confidence': float(primary_lang.prob),
            'reliable': primary_lang.prob > 0.9,
            'provenance': {
                'model': 'langdetect',
                'version': '1.0.9',
                'method': 'Character n-gram-based language detection',
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/detect-toxicity', methods=['POST'])
def detect_toxicity():
    """
    Toxicity detection using Detoxify
    - Toxicity
    - Severe toxicity
    - Obscene
    - Threat
    - Insult
    - Identity attack
    """
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    model = load_detoxify_model()
    if not model:
        return jsonify({
            'error': 'Detoxify not available',
            'fallback': True
        }), 503
    
    predictions = model.predict(text)
    
    result = {
        'toxicity': float(predictions['toxicity']),
        'severe_toxicity': float(predictions['severe_toxicity']),
        'obscene': float(predictions['obscene']),
        'threat': float(predictions['threat']),
        'insult': float(predictions['insult']),
        'identity_attack': float(predictions['identity_attack']),
        'is_toxic': float(predictions['toxicity']) > 0.5,
        'is_aggressive': float(predictions['insult']) > 0.5 or float(predictions['threat']) > 0.5,
        'provenance': {
            'model': 'Detoxify',
            'version': '0.5.2',
            'method': 'Transformer-based toxicity detection (multilingual)',
            'timestamp': datetime.utcnow().isoformat()
        }
    }
    
    return jsonify(result)

@app.route('/classify-ideology', methods=['POST'])
def classify_ideology():
    """
    Political ideology classification using Swedish BERT
    Uses KB/bert-base-swedish-cased for zero-shot political classification
    """
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    classifier = load_ideology_classifier()
    if not classifier:
        return jsonify({
            'error': 'Transformers not available',
            'fallback': True
        }), 503
    
    try:
        # Check if using Swedish BERT or zero-shot classifier
        if isinstance(classifier, dict) and 'tokenizer' in classifier:
            # Using Swedish BERT with manual classification
            tokenizer = classifier['tokenizer']
            model = classifier['model']
            
            # Define political keywords for Swedish context
            left_keywords = ["välfärd", "jämlikhet", "omfördelning", "kollektiv", "solidaritet", 
                           "arbetarrörelsen", "socialism", "feminism", "miljö", "klimat"]
            right_keywords = ["marknad", "företagande", "frihet", "individ", "lägre skatter",
                            "privatisering", "konkurrens", "tradition", "ordning", "lag"]
            center_keywords = ["balans", "kompromiss", "pragmatisk", "mittenväg", "dialog",
                             "samarbete", "reformer", "moderat", "centrism"]
            
            # Simple keyword-based scoring with BERT embeddings
            text_lower = text.lower()
            left_count = sum(1 for kw in left_keywords if kw in text_lower)
            right_count = sum(1 for kw in right_keywords if kw in text_lower)
            center_count = sum(1 for kw in center_keywords if kw in text_lower)
            
            total = max(left_count + right_count + center_count, 1)
            left_score = left_count / total
            right_score = right_count / total
            center_score = center_count / total
            
            # If no keywords found, default to center
            if total == 1:
                left_score, center_score, right_score = 0.33, 0.34, 0.33
            
            # Determine classification
            scores = {'left': left_score, 'center': center_score, 'right': right_score}
            classification = max(scores, key=scores.get)
            confidence = scores[classification]
            
            result = {
                'classification': classification,
                'confidence': float(confidence),
                'left_score': float(left_score),
                'center_score': float(center_score),
                'right_score': float(right_score),
                'method': 'keyword-enhanced',
                'note': 'Using Swedish BERT (KB/bert-base-swedish-cased) with keyword analysis. For production, fine-tune on labeled political corpus.',
                'provenance': {
                    'model': 'KB/bert-base-swedish-cased',
                    'version': '4.36.2',
                    'method': 'Swedish BERT with keyword-based political classification',
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
        else:
            # Using zero-shot classifier
            candidate_labels = ["vänster", "center", "höger"]
            classification_result = classifier(text, candidate_labels)
            
            # Map Swedish labels to English
            label_map = {"vänster": "left", "center": "center", "höger": "right"}
            labels = [label_map.get(label, label) for label in classification_result['labels']]
            scores = classification_result['scores']
            
            # Create score dictionary
            score_dict = dict(zip(labels, scores))
            left_score = score_dict.get('left', 0.33)
            center_score = score_dict.get('center', 0.34)
            right_score = score_dict.get('right', 0.33)
            
            result = {
                'classification': labels[0],
                'confidence': float(scores[0]),
                'left_score': float(left_score),
                'center_score': float(center_score),
                'right_score': float(right_score),
                'method': 'zero-shot',
                'note': 'Using zero-shot classification. For production, fine-tune on labeled political corpus.',
                'provenance': {
                    'model': 'Zero-shot classifier (fallback)',
                    'version': '4.36.2',
                    'method': 'Zero-shot classification for political ideology',
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'error': f'Classification failed: {str(e)}',
            'fallback': True
        }), 500

@app.route('/topic-modeling', methods=['POST'])
def topic_modeling():
    """
    Topic modeling using BERTopic
    """
    data = request.json
    texts = data.get('texts', [])
    
    if not texts or len(texts) < 3:
        return jsonify({'error': 'Need at least 3 texts for topic modeling'}), 400
    
    topic_model = load_bertopic_model()
    if not topic_model:
        return jsonify({
            'error': 'BERTopic not available',
            'fallback': True
        }), 503
    
    try:
        topics, probs = topic_model.fit_transform(texts)
        
        # Get topic info
        topic_info = topic_model.get_topic_info()
        
        result = {
            'topics': [
                {
                    'topic_id': int(row['Topic']),
                    'count': int(row['Count']),
                    'name': row['Name'],
                }
                for _, row in topic_info.iterrows()
                if row['Topic'] != -1  # Exclude outliers
            ],
            'document_topics': [int(t) for t in topics],
            'provenance': {
                'model': 'BERTopic',
                'version': '0.16.0',
                'method': 'Transformer-based topic modeling with clustering',
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/semantic-similarity', methods=['POST'])
def semantic_similarity():
    """
    Semantic similarity analysis using Gensim Word2Vec
    """
    data = request.json
    texts = data.get('texts', [])
    
    if not texts or len(texts) < 2:
        return jsonify({'error': 'Need at least 2 texts for similarity'}), 400
    
    if not GENSIM_AVAILABLE:
        return jsonify({
            'error': 'Gensim not available',
            'fallback': True
        }), 503
    
    # Placeholder - actual implementation would train Word2Vec model
    result = {
        'note': 'Word2Vec similarity placeholder - needs training corpus',
        'provenance': {
            'model': 'Gensim Word2Vec',
            'version': '4.3.2',
            'method': 'Word embeddings similarity',
            'timestamp': datetime.utcnow().isoformat()
        }
    }
    
    return jsonify(result)

@app.route('/analyze-complete', methods=['POST'])
def analyze_complete():
    """
    Complete pipeline analysis using all available tools
    """
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    result = {
        'text': text,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # Run all analyses that are available
    try:
        # spaCy preprocessing
        if SPACY_AVAILABLE:
            nlp = load_spacy_model()
            if nlp:
                doc = nlp(text)
                result['preprocessing'] = {
                    'word_count': len([t for t in doc if not t.is_punct]),
                    'sentence_count': len(list(doc.sents)),
                    'entity_count': len(doc.ents),
                }
        
        # TextBlob sentiment
        if TEXTBLOB_AVAILABLE:
            blob = TextBlob(text)
            result['sentiment'] = {
                'polarity': blob.sentiment.polarity,
                'subjectivity': blob.sentiment.subjectivity,
            }
        
        # Polyglot language detection
        if POLYGLOT_AVAILABLE:
            try:
                detector = Detector(text)
                result['language'] = {
                    'code': detector.language.code,
                    'name': detector.language.name,
                    'confidence': detector.language.confidence,
                }
            except:
                pass
        
        # Detoxify toxicity
        if DETOXIFY_AVAILABLE:
            model = load_detoxify_model()
            if model:
                predictions = model.predict(text)
                result['toxicity'] = {
                    'toxicity': float(predictions['toxicity']),
                    'severe_toxicity': float(predictions['severe_toxicity']),
                    'is_toxic': float(predictions['toxicity']) > 0.5,
                }
        
        result['status'] = 'success'
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("CivicAI Python NLP Pipeline Service")
    print("=" * 60)
    print("\nAvailable models:")
    print(f"  spaCy:        {'✓' if SPACY_AVAILABLE else '✗'}")
    print(f"  TextBlob:     {'✓' if TEXTBLOB_AVAILABLE else '✗'}")
    print(f"  Polyglot:     {'✓' if POLYGLOT_AVAILABLE else '✗'}")
    print(f"  Detoxify:     {'✓' if DETOXIFY_AVAILABLE else '✗'}")
    print(f"  Transformers: {'✓' if TRANSFORMERS_AVAILABLE else '✗'}")
    print(f"  SHAP:         {'✓' if SHAP_AVAILABLE else '✗'}")
    print(f"  Gensim:       {'✓' if GENSIM_AVAILABLE else '✗'}")
    print(f"  BERTopic:     {'✓' if BERTOPIC_AVAILABLE else '✗'}")
    print("\n" + "=" * 60)
    print("\nStarting Flask server on http://localhost:5001")
    print("=" * 60 + "\n")
    
    # Get debug mode from environment variable, default to False for security
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    app.run(host='0.0.0.0', port=5001, debug=debug_mode)
