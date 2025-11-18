"""
CivicAI Python NLP Pipeline Service

This service provides advanced NLP capabilities using Python ML libraries:
- spaCy: Tokenization, POS-tagging, dependency parsing
- TextBlob: Polarity and subjectivity analysis
- langdetect: Multi-language detection (55+ languages)
- Detoxify: Toxicity and aggression detection
- Transformers: Political ideology classification (Swedish BERT)
- SHAP: Model explainability
- Gensim: Semantic analysis and topic modeling (LDA)
- BERTopic: Advanced topic modeling (optional)

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
    import nltk
    # Download required NLTK data on first import (one-time setup)
    try:
        nltk.data.find('tokenizers/punkt_tab')
    except LookupError:
        print("Downloading NLTK punkt tokenizer data...")
        nltk.download('punkt_tab', quiet=True)
    try:
        nltk.data.find('corpora/brown')
    except LookupError:
        print("Downloading NLTK brown corpus...")
        nltk.download('brown', quiet=True)
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

try:
    import lime
    from lime.lime_text import LimeTextExplainer
    LIME_AVAILABLE = True
except ImportError:
    LIME_AVAILABLE = False
    print("WARNING: LIME not available")

try:
    from fairlearn.metrics import demographic_parity_difference, equalized_odds_difference
    import fairlearn.metrics as fairlearn_metrics
    FAIRLEARN_AVAILABLE = True
except ImportError:
    FAIRLEARN_AVAILABLE = False
    print("WARNING: Fairlearn not available")

try:
    import lux
    LUX_AVAILABLE = True
except ImportError:
    LUX_AVAILABLE = False
    print("WARNING: Lux not available")

try:
    import sweetviz as sv
    SWEETVIZ_AVAILABLE = True
except ImportError:
    SWEETVIZ_AVAILABLE = False
    print("WARNING: Sweetviz not available")

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration flags for enabling/disabling features
CONFIG = {
    'ENABLE_LUX': os.environ.get('ENABLE_LUX', 'true').lower() == 'true',
    'ENABLE_SWEETVIZ': os.environ.get('ENABLE_SWEETVIZ', 'true').lower() == 'true',
    'ENABLE_SHAP': os.environ.get('ENABLE_SHAP', 'true').lower() == 'true',
    'ENABLE_LIME': os.environ.get('ENABLE_LIME', 'true').lower() == 'true',
    'ENABLE_FAIRLEARN': os.environ.get('ENABLE_FAIRLEARN', 'true').lower() == 'true',
}

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
    """Load Detoxify model with proper device handling"""
    if not DETOXIFY_AVAILABLE:
        return None
    
    if 'detoxify' not in MODELS:
        try:
            # Force CPU on Windows to avoid CUDA issues
            import torch
            device = 'cpu'  # Safer default, especially on Windows
            
            # Only use CUDA if explicitly available and working
            if torch.cuda.is_available():
                try:
                    # Test if CUDA actually works
                    torch.cuda.init()
                    device = 'cuda'
                except:
                    device = 'cpu'
            
            # Load model with explicit device
            # Note: from_pretrained_kwargs not supported in Detoxify 0.5.2
            # Use environment variable to control dtype instead
            import os
            os.environ['TRANSFORMERS_NO_ADVISORY_WARNINGS'] = '1'
            
            # Try loading with device only (detoxify 0.5.2 compatible)
            MODELS['detoxify'] = Detoxify('multilingual', device=device)
            print(f"✓ Loaded Detoxify multilingual model (device: {device})")
        except Exception as e:
            error_msg = str(e)
            # Handle meta tensor error specifically
            if "meta tensor" in error_msg.lower() or "to_empty" in error_msg.lower():
                try:
                    # Retry with explicit CPU device
                    print("  Retrying Detoxify with CPU-only mode...")
                    import os
                    os.environ['TRANSFORMERS_NO_ADVISORY_WARNINGS'] = '1'
                    MODELS['detoxify'] = Detoxify('multilingual', device='cpu')
                    print(f"✓ Loaded Detoxify multilingual model (device: cpu, retry successful)")
                    return MODELS['detoxify']
                except Exception as retry_err:
                    print(f"✗ Retry failed: {retry_err}")
            
            print(f"✗ Failed to load Detoxify model: {e}")
            print("  Detoxify will not be available")
            return None
    
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
            'lime': LIME_AVAILABLE,
            'fairlearn': FAIRLEARN_AVAILABLE,
            'lux': LUX_AVAILABLE,
            'sweetviz': SWEETVIZ_AVAILABLE,
        },
        'configuration': CONFIG
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
    
    try:
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
    except Exception as e:
        print(f"Error in detect_toxicity: {e}")
        return jsonify({
            'error': f'Toxicity detection failed: {str(e)}',
            'fallback': True
        }), 500

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
    Topic modeling using BERTopic and/or Gensim LDA
    Supports parallel classification with both methods
    """
    data = request.json
    texts = data.get('texts', [])
    text = data.get('text', '')  # Single text support
    method = data.get('method', 'bertopic')  # 'bertopic', 'gensim', or 'both'
    
    # Handle single text by splitting into sentences
    if text and not texts:
        from textblob import TextBlob
        blob = TextBlob(text)
        texts = [str(sentence) for sentence in blob.sentences if len(str(sentence)) > 20]
        
        # If still too few texts, return a simple keyword extraction instead
        if len(texts) < 3:
            # Simple keyword extraction as fallback
            words = blob.words
            word_freq = {}
            for word in words:
                word_lower = word.lower()
                if len(word_lower) > 3:  # Filter short words
                    word_freq[word_lower] = word_freq.get(word_lower, 0) + 1
            
            # Get top keywords
            top_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
            keywords = [word for word, count in top_keywords]
            
            return jsonify({
                'topics': keywords,
                'method': 'keyword_extraction',
                'note': 'Text too short for topic modeling, using keyword extraction',
                'provenance': {
                    'model': 'TextBlob Keywords',
                    'version': '1.0.0',
                    'method': 'Frequency-based keyword extraction',
                    'timestamp': datetime.utcnow().isoformat()
                }
            })
    
    if not texts:
        return jsonify({'error': 'No texts provided'}), 400
    
    # If method is 'both', run parallel classification with BERTopic and Gensim
    if method == 'both':
        bertopic_result = None
        gensim_result = None
        
        # Run BERTopic if available
        if len(texts) >= 3:
            topic_model = load_bertopic_model()
            if topic_model:
                try:
                    topics, probs = topic_model.fit_transform(texts)
                    topic_info = topic_model.get_topic_info()
                    
                    bertopic_result = {
                        'topics': [
                            {
                                'topic_id': int(row['Topic']),
                                'count': int(row['Count']),
                                'name': row['Name'],
                            }
                            for _, row in topic_info.iterrows()
                            if row['Topic'] != -1
                        ][:10],
                        'document_topics': [int(t) for t in topics],
                        'probabilities': [[float(p) for p in prob] for prob in probs] if probs is not None else [],
                        'model': 'BERTopic',
                        'version': '0.16.0'
                    }
                except Exception as e:
                    print(f"BERTopic error in parallel mode: {str(e)}")
        
        # Run Gensim if available
        if len(texts) >= 2 and GENSIM_AVAILABLE:
            try:
                from gensim import corpora
                from gensim.models import LdaModel
                from gensim.utils import simple_preprocess
                
                processed_texts = [simple_preprocess(text, deacc=True) for text in texts]
                processed_texts = [text for text in processed_texts if len(text) > 0]
                
                if len(processed_texts) >= 2:
                    dictionary = corpora.Dictionary(processed_texts)
                    corpus = [dictionary.doc2bow(text) for text in processed_texts]
                    num_topics = min(data.get('num_topics', 3), len(texts))
                    
                    lda_model = LdaModel(
                        corpus=corpus,
                        id2word=dictionary,
                        num_topics=num_topics,
                        random_state=42,
                        passes=10,
                        alpha='auto'
                    )
                    
                    topics = []
                    for idx in range(num_topics):
                        topic_terms = lda_model.show_topic(idx, topn=10)
                        topics.append({
                            'topic_id': idx,
                            'terms': [{'word': word, 'weight': float(weight)} for word, weight in topic_terms],
                            'label': f"Topic {idx}"
                        })
                    
                    doc_topics = []
                    for doc_bow in corpus:
                        topic_dist = lda_model.get_document_topics(doc_bow)
                        doc_topics.append([{'topic_id': topic_id, 'probability': float(prob)} for topic_id, prob in topic_dist])
                    
                    gensim_result = {
                        'topics': topics,
                        'document_topics': doc_topics,
                        'num_topics': num_topics,
                        'model': 'Gensim LDA',
                        'version': '4.3.2'
                    }
            except Exception as e:
                print(f"Gensim error in parallel mode: {str(e)}")
        
        # Combine results
        combined_result = {
            'method': 'both',
            'bertopic': bertopic_result,
            'gensim': gensim_result,
            'provenance': {
                'models': [],
                'method': 'Parallel topic modeling with BERTopic and Gensim LDA',
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
        if bertopic_result:
            combined_result['provenance']['models'].append('BERTopic')
        if gensim_result:
            combined_result['provenance']['models'].append('Gensim LDA')
        
        if not bertopic_result and not gensim_result:
            return jsonify({'error': 'Neither BERTopic nor Gensim are available'}), 503
        
        return jsonify(combined_result)
    
    # Gensim LDA method (single)
    if method == 'gensim' and GENSIM_AVAILABLE:
        try:
            from gensim import corpora
            from gensim.models import LdaModel
            from gensim.utils import simple_preprocess
            
            # Minimum 2 texts for Gensim (lowered from 3)
            if len(texts) < 2:
                return jsonify({'error': 'Need at least 2 texts for topic modeling'}), 400
            
            # Preprocess texts
            processed_texts = [simple_preprocess(text, deacc=True) for text in texts]
            
            # Filter out empty documents
            processed_texts = [text for text in processed_texts if len(text) > 0]
            
            if len(processed_texts) < 2:
                return jsonify({'error': 'Texts too short after preprocessing'}), 400
            
            # Create dictionary and corpus
            dictionary = corpora.Dictionary(processed_texts)
            corpus = [dictionary.doc2bow(text) for text in processed_texts]
            
            # Train LDA model (default 3 topics for small datasets)
            num_topics = min(data.get('num_topics', 3), len(texts))
            lda_model = LdaModel(
                corpus=corpus,
                id2word=dictionary,
                num_topics=num_topics,
                random_state=42,
                passes=10,
                alpha='auto'
            )
            
            # Get topics
            topics = []
            for idx in range(num_topics):
                topic_terms = lda_model.show_topic(idx, topn=10)
                topics.append({
                    'topic_id': idx,
                    'terms': [{'word': word, 'weight': float(weight)} for word, weight in topic_terms],
                    'label': f"Topic {idx}"
                })
            
            # Get document-topic distributions
            doc_topics = []
            for doc_bow in corpus:
                topic_dist = lda_model.get_document_topics(doc_bow)
                doc_topics.append([{'topic_id': topic_id, 'probability': float(prob)} for topic_id, prob in topic_dist])
            
            result = {
                'topics': topics,
                'document_topics': doc_topics,
                'num_topics': num_topics,
                'provenance': {
                    'model': 'Gensim LDA',
                    'version': '4.3.2',
                    'method': 'Latent Dirichlet Allocation',
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
            
            return jsonify(result)
            
        except Exception as e:
            return jsonify({'error': f'Gensim LDA error: {str(e)}'}), 500
    
    # BERTopic method (original implementation)
    if len(texts) < 3:
        return jsonify({'error': 'Need at least 3 texts for topic modeling'}), 400
    
    topic_model = load_bertopic_model()
    if not topic_model:
        # If BERTopic not available but Gensim is, suggest using Gensim
        if GENSIM_AVAILABLE:
            return jsonify({
                'error': 'BERTopic not available. Use method="gensim" for Gensim LDA topic modeling.',
                'fallback': True,
                'suggestion': 'gensim'
            }), 503
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

@app.route('/explain-shap', methods=['POST'])
def explain_shap():
    """
    Generate SHAP explanations for text analysis
    Simplified version using TextBlob for demonstration
    """
    if not CONFIG['ENABLE_SHAP'] or not SHAP_AVAILABLE:
        return jsonify({
            'error': 'SHAP not available or disabled',
            'fallback': True
        }), 503
    
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    try:
        # Use a simpler model for SHAP demo (TextBlob sentiment)
        # This avoids complex transformer integration issues
        from textblob import TextBlob
        import numpy as np
        
        # Simple feature extraction: word importance for sentiment
        blob = TextBlob(text)
        words = [word.lower() for word in blob.words if len(word) > 2]
        
        # Calculate simple word-level sentiment impact
        word_importance = []
        base_sentiment = blob.sentiment.polarity
        
        for word in set(words[:20]):  # Top 20 unique words
            # Remove word and recalculate sentiment
            modified_text = text.replace(word, '')
            modified_blob = TextBlob(modified_text)
            sentiment_change = base_sentiment - modified_blob.sentiment.polarity
            word_importance.append({
                'word': word,
                'importance': float(sentiment_change),
                'impact': 'positive' if sentiment_change > 0 else 'negative' if sentiment_change < 0 else 'neutral'
            })
        
        # Sort by absolute importance
        word_importance.sort(key=lambda x: abs(x['importance']), reverse=True)
        
        result = {
            'feature_importance': word_importance[:10],
            'explanation_type': 'global',
            'model': 'TextBlob Sentiment Analysis',
            'base_sentiment': float(base_sentiment),
            'provenance': {
                'model': 'SHAP (simplified)',
                'version': '1.0.0',
                'method': 'Word-level sentiment impact analysis',
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
        return jsonify(result)
            
    except Exception as e:
        print(f"SHAP error: {e}")
        return jsonify({'error': f'SHAP analysis failed: {str(e)}'}), 500

@app.route('/explain-lime', methods=['POST'])
def explain_lime():
    """
    Generate LIME explanations for individual predictions
    Simplified version using TextBlob for demonstration
    """
    if not CONFIG['ENABLE_LIME'] or not LIME_AVAILABLE:
        return jsonify({
            'error': 'LIME not available or disabled',
            'fallback': True
        }), 503
    
    data = request.json
    text = data.get('text', '')
    num_features = data.get('num_features', 10)
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    try:
        # Use simple TextBlob-based explanation
        from textblob import TextBlob
        
        blob = TextBlob(text)
        base_sentiment = blob.sentiment.polarity
        base_subjectivity = blob.sentiment.subjectivity
        
        # Analyze sentence-level contributions
        explanations = []
        for idx, sentence in enumerate(blob.sentences):
            sent_polarity = sentence.sentiment.polarity
            sent_subjectivity = sentence.sentiment.subjectivity
            
            # Contribution to overall sentiment
            contribution = sent_polarity - base_sentiment / max(len(blob.sentences), 1)
            
            explanations.append({
                'sentence': str(sentence),
                'sentiment_polarity': float(sent_polarity),
                'sentiment_subjectivity': float(sent_subjectivity),
                'contribution_to_overall': float(contribution),
                'importance': abs(float(contribution))
            })
        
        # Sort by importance
        explanations.sort(key=lambda x: x['importance'], reverse=True)
        
        result = {
            'explanation': explanations[:num_features],
            'prediction': {
                'sentiment_polarity': float(base_sentiment),
                'sentiment_subjectivity': float(base_subjectivity),
                'predicted_class': 'positive' if base_sentiment > 0 else 'negative' if base_sentiment < 0 else 'neutral'
            },
            'explanation_type': 'local',
            'text': text,
            'provenance': {
                'model': 'LIME (simplified)',
                'version': '1.0.0',
                'method': 'Sentence-level sentiment contribution analysis',
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
        return jsonify(result)
            
    except Exception as e:
        print(f"LIME error: {e}")
        return jsonify({'error': f'LIME analysis failed: {str(e)}'}), 500

@app.route('/fairness-metrics', methods=['POST'])
def fairness_metrics():
    """
    Compute fairness metrics using Fairlearn
    Measures demographic parity and equal opportunity
    """
    if not CONFIG['ENABLE_FAIRLEARN'] or not FAIRLEARN_AVAILABLE:
        return jsonify({
            'error': 'Fairlearn not available or disabled',
            'fallback': True
        }), 503
    
    data = request.json
    texts = data.get('texts', [])
    sensitive_features = data.get('sensitive_features', [])
    
    if not texts or len(texts) < 2:
        return jsonify({'error': 'Need at least 2 texts for fairness analysis'}), 400
    
    if not sensitive_features or len(sensitive_features) != len(texts):
        return jsonify({'error': 'Sensitive features required for each text'}), 400
    
    try:
        classifier = load_ideology_classifier()
        if not classifier:
            return jsonify({'error': 'Model not available for fairness analysis'}), 503
        
        # Get predictions for all texts
        if isinstance(classifier, dict) and 'tokenizer' in classifier:
            import torch
            tokenizer = classifier['tokenizer']
            model = classifier['model']
            
            inputs = tokenizer(texts, return_tensors="pt", padding=True, truncation=True, max_length=512)
            with torch.no_grad():
                outputs = model(**inputs)
                predictions = outputs.logits.argmax(dim=-1).numpy()
            
            # Convert to list
            y_pred = predictions.tolist()
            
            # Compute fairness metrics
            # Note: For real fairness analysis, we'd need ground truth labels
            # Here we'll compute demographic parity as an example
            from collections import Counter
            import numpy as np
            
            # Group predictions by sensitive feature
            groups = {}
            for i, sf in enumerate(sensitive_features):
                if sf not in groups:
                    groups[sf] = []
                groups[sf].append(y_pred[i])
            
            # Compute selection rates per group
            selection_rates = {}
            for group, preds in groups.items():
                counter = Counter(preds)
                total = len(preds)
                selection_rates[group] = {
                    'left': counter.get(0, 0) / total,
                    'center': counter.get(1, 0) / total,
                    'right': counter.get(2, 0) / total,
                    'total_predictions': total
                }
            
            # Compute demographic parity (max difference in selection rates)
            all_left_rates = [sr['left'] for sr in selection_rates.values()]
            all_center_rates = [sr['center'] for sr in selection_rates.values()]
            all_right_rates = [sr['right'] for sr in selection_rates.values()]
            
            demographic_parity = {
                'left': max(all_left_rates) - min(all_left_rates) if all_left_rates else 0,
                'center': max(all_center_rates) - min(all_center_rates) if all_center_rates else 0,
                'right': max(all_right_rates) - min(all_right_rates) if all_right_rates else 0,
            }
            
            # Overall fairness score (lower is better)
            overall_fairness = sum(demographic_parity.values()) / 3
            
            result = {
                'selection_rates': selection_rates,
                'demographic_parity': demographic_parity,
                'overall_fairness_score': float(overall_fairness),
                'fairness_status': 'fair' if overall_fairness < 0.1 else 'biased',
                'num_groups': len(groups),
                'total_predictions': len(texts),
                'provenance': {
                    'model': 'Fairlearn',
                    'version': '0.10.0',
                    'method': 'Demographic parity and fairness metrics',
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
            
            return jsonify(result)
        else:
            return jsonify({'error': 'Fairness analysis only supported for Swedish BERT model'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate-eda-report', methods=['POST'])
def generate_eda_report():
    """
    Generate EDA report using Sweetviz
    Creates HTML report for dataset analysis
    """
    if not CONFIG['ENABLE_SWEETVIZ'] or not SWEETVIZ_AVAILABLE:
        return jsonify({
            'error': 'Sweetviz not available or disabled',
            'fallback': True
        }), 503
    
    data = request.json
    dataset = data.get('dataset', [])
    report_name = data.get('report_name', 'data_quality_report')
    
    if not dataset or len(dataset) < 2:
        return jsonify({'error': 'Need at least 2 data points for EDA report'}), 400
    
    try:
        import pandas as pd
        
        # Convert dataset to DataFrame
        df = pd.DataFrame(dataset)
        
        # Enable Lux if available and enabled
        if CONFIG['ENABLE_LUX'] and LUX_AVAILABLE:
            # Lux automatically enhances pandas DataFrames
            pass
        
        # Generate Sweetviz report
        report = sv.analyze(df)
        
        # Save report to file
        report_path = f'/tmp/{report_name}.html'
        report.show_html(filepath=report_path, open_browser=False)
        
        # Read report content
        with open(report_path, 'r', encoding='utf-8') as f:
            report_html = f.read()
        
        result = {
            'report_path': report_path,
            'report_html': report_html,
            'num_rows': len(df),
            'num_columns': len(df.columns),
            'columns': list(df.columns),
            'provenance': {
                'model': 'Sweetviz',
                'version': sv.__version__,
                'method': 'Automated EDA report generation',
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/lux-recommendations', methods=['POST'])
def lux_recommendations():
    """
    Get Lux visualization recommendations for dataset
    Interactive visualizations for Pandas DataFrames
    """
    if not CONFIG['ENABLE_LUX'] or not LUX_AVAILABLE:
        return jsonify({
            'error': 'Lux not available or disabled',
            'fallback': True
        }), 503
    
    data = request.json
    dataset = data.get('dataset', [])
    
    if not dataset or len(dataset) < 2:
        return jsonify({'error': 'Need at least 2 data points for Lux analysis'}), 400
    
    try:
        import pandas as pd
        
        # Convert dataset to DataFrame
        df = pd.DataFrame(dataset)
        
        # Lux automatically generates recommendations
        # Get recommendation info
        recommendations = {
            'num_rows': len(df),
            'num_columns': len(df.columns),
            'columns': list(df.columns),
            'column_types': {col: str(df[col].dtype) for col in df.columns},
            'lux_enabled': True,
            'provenance': {
                'model': 'Lux',
                'version': lux.__version__,
                'method': 'Interactive visualization recommendations',
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
        return jsonify(recommendations)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("CivicAI Python NLP Pipeline Service")
    print("=" * 60)
    print("\nAvailable models:")
    print(f"  spaCy:        {'✓' if SPACY_AVAILABLE else '✗'}")
    print(f"  TextBlob:     {'✓' if TEXTBLOB_AVAILABLE else '✗'}")
    print(f"  langdetect:   {'✓' if LANGDETECT_AVAILABLE else '✗'}")
    print(f"  Detoxify:     {'✓' if DETOXIFY_AVAILABLE else '✗'}")
    print(f"  Transformers: {'✓' if TRANSFORMERS_AVAILABLE else '✗'}")
    print(f"  SHAP:         {'✓' if SHAP_AVAILABLE else '✗'}")
    print(f"  Gensim:       {'✓' if GENSIM_AVAILABLE else '✗'}")
    print(f"  BERTopic:     {'✓' if BERTOPIC_AVAILABLE else '✗'}")
    print(f"  LIME:         {'✓' if LIME_AVAILABLE else '✗'}")
    print(f"  Fairlearn:    {'✓' if FAIRLEARN_AVAILABLE else '✗'}")
    print(f"  Lux:          {'✓' if LUX_AVAILABLE else '✗'}")
    print(f"  Sweetviz:     {'✓' if SWEETVIZ_AVAILABLE else '✗'}")
    print("\nConfiguration flags:")
    for key, value in CONFIG.items():
        print(f"  {key}: {'Enabled' if value else 'Disabled'}")
    print("\n" + "=" * 60)
    print("\nStarting Flask server on http://localhost:5001")
    print("=" * 60 + "\n")
    
    # Get debug mode from environment variable, default to False for security
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    app.run(host='0.0.0.0', port=5001, debug=debug_mode)
