#!/usr/bin/env python3
"""
Change Detection Module for OpenSeek.AI
Tracks and analyzes changes in AI model responses over time with Transparency Ledger integration

Features:
- Text similarity analysis using embeddings and cosine similarity
- Sentiment shift detection
- Ideology shift detection
- Change Severity Index calculation
- Explainability Delta (feature importance tracking)
- Bias Drift Tracking
- Thematic Drift analysis
- Consensus Shift detection
- Ethical Impact Tagging
"""

import json
import hashlib
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import re

# Import transparency ledger for block creation
try:
    from .transparency_ledger import TransparencyLedger
except ImportError:
    from transparency_ledger import TransparencyLedger


class ChangeDetectionModule:
    """Detects and analyzes changes in AI model responses over time"""
    
    def __init__(self, ledger_dir: str, history_dir: str, quiet: bool = False):
        """
        Initialize Change Detection Module
        
        Args:
            ledger_dir: Directory for transparency ledger
            history_dir: Directory for storing response history
            quiet: If True, suppress informational messages (for API/JSON mode)
        """
        self.ledger = TransparencyLedger(ledger_dir, quiet=quiet)
        self.history_dir = Path(history_dir)
        self.history_dir.mkdir(parents=True, exist_ok=True)
        self.quiet = quiet
        
    def _hash_question(self, question: str) -> str:
        """Create SHA-256 hash of question for indexing"""
        return hashlib.sha256(question.encode('utf-8')).hexdigest()
    
    def _get_history_file(self, question_hash: str, model: str) -> Path:
        """Get path to history file for a question-model pair"""
        return self.history_dir / f"{question_hash}_{model}.json"
    
    def _load_previous_response(self, question: str, model: str) -> Optional[Dict]:
        """Load previous response for the same question and model"""
        question_hash = self._hash_question(question)
        history_file = self._get_history_file(question_hash, model)
        
        if history_file.exists():
            try:
                with open(history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
                    # Return the most recent response
                    if history.get('responses'):
                        return history['responses'][-1]
            except json.JSONDecodeError:
                # History file is corrupted - remove it and start fresh
                if not self.quiet:
                    print(f"WARNING: Corrupted history file for {model}, creating new history", file=sys.stderr)
                history_file.unlink()
        
        return None
    
    def _save_response(self, question: str, model: str, response: str, metadata: Dict = None):
        """Save response to history"""
        question_hash = self._hash_question(question)
        history_file = self._get_history_file(question_hash, model)
        
        # Load existing history or create new
        if history_file.exists():
            try:
                with open(history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            except json.JSONDecodeError:
                # History file is corrupted - start fresh
                if not self.quiet:
                    print(f"WARNING: Corrupted history file for {model}, creating new history", file=sys.stderr)
                history = {
                    'question': question,
                    'question_hash': question_hash,
                    'model': model,
                    'responses': []
                }
        else:
            history = {
                'question': question,
                'question_hash': question_hash,
                'model': model,
                'responses': []
            }
        
        # Add new response
        history['responses'].append({
            'timestamp': datetime.now().isoformat(),
            'response': response,
            'metadata': metadata or {}
        })
        
        # Save back to file
        with open(history_file, 'w', encoding='utf-8') as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
    
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate text similarity using simple word overlap
        In production, this would use embeddings and cosine similarity
        
        Returns:
            Similarity score between 0 and 1
        """
        # Normalize texts
        words1 = set(re.findall(r'\w+', text1.lower()))
        words2 = set(re.findall(r'\w+', text2.lower()))
        
        if not words1 or not words2:
            return 0.0
        
        # Calculate Jaccard similarity
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def _detect_sentiment_shift(self, text1: str, text2: str) -> Tuple[str, str, str]:
        """
        Detect sentiment shift between two texts
        
        Returns:
            (previous_sentiment, current_sentiment, shift_description)
        """
        # Simple keyword-based sentiment detection
        # In production, use sentiment analysis models
        
        positive_words = ['bra', 'bör', 'viktigt', 'avgörande', 'prioriteras', 'positiv', 'möjlighet']
        negative_words = ['problem', 'risk', 'negativ', 'svårt', 'utmaning']
        
        def get_sentiment(text):
            text_lower = text.lower()
            pos_count = sum(1 for word in positive_words if word in text_lower)
            neg_count = sum(1 for word in negative_words if word in text_lower)
            
            if pos_count > neg_count:
                return 'positiv'
            elif neg_count > pos_count:
                return 'negativ'
            else:
                return 'neutral'
        
        sent1 = get_sentiment(text1)
        sent2 = get_sentiment(text2)
        
        if sent1 == sent2:
            shift = f"Stabilt {sent1}"
        else:
            shift = f"{sent1} → {sent2}"
        
        return sent1, sent2, shift
    
    def _detect_ideology_shift(self, text1: str, text2: str) -> Tuple[str, str, str]:
        """
        Detect ideological shift between two texts
        
        Returns:
            (previous_ideology, current_ideology, shift_description)
        """
        # Simple keyword-based ideology detection
        # In production, use ideology classification models
        
        green_keywords = ['klimat', 'miljö', 'hållbar', 'grön']
        left_keywords = ['jämlikhet', 'välfärd', 'solidaritet', 'rättvis']
        right_keywords = ['ekonomisk tillväxt', 'marknad', 'företagande', 'effektivitet']
        
        def get_ideology(text):
            text_lower = text.lower()
            green_score = sum(1 for word in green_keywords if word in text_lower)
            left_score = sum(1 for word in left_keywords if word in text_lower)
            right_score = sum(1 for word in right_keywords if word in text_lower)
            
            if green_score > 0 and green_score >= max(left_score, right_score):
                return 'grön'
            elif left_score > right_score:
                return 'vänster'
            elif right_score > left_score:
                return 'höger'
            else:
                return 'center'
        
        ideo1 = get_ideology(text1)
        ideo2 = get_ideology(text2)
        
        if ideo1 == ideo2:
            shift = f"Stabilt {ideo1}"
        else:
            shift = f"{ideo1} → {ideo2}"
        
        return ideo1, ideo2, shift
    
    def _calculate_severity_index(self, similarity: float, sentiment_changed: bool, ideology_changed: bool) -> float:
        """
        Calculate Change Severity Index (0-1)
        
        Higher values indicate more significant changes
        """
        # Base severity from text dissimilarity
        severity = 1.0 - similarity
        
        # Increase severity if sentiment or ideology changed
        if sentiment_changed:
            severity = min(1.0, severity + 0.2)
        
        if ideology_changed:
            severity = min(1.0, severity + 0.2)
        
        return round(severity, 2)
    
    def _extract_dominant_themes(self, text: str) -> List[str]:
        """
        Extract dominant themes from text
        
        Returns:
            List of dominant theme keywords
        """
        # Simple keyword extraction
        # In production, use topic modeling (LDA, BERTopic)
        
        theme_keywords = {
            'klimat': ['klimat', 'miljö', 'hållbar'],
            'ekonomi': ['ekonomi', 'tillväxt', 'marknad', 'företag'],
            'välfärd': ['välfärd', 'vård', 'skola', 'omsorg'],
            'säkerhet': ['säkerhet', 'försvar', 'brottslighet'],
            'migration': ['migration', 'integration', 'invandring'],
        }
        
        text_lower = text.lower()
        themes = []
        
        for theme, keywords in theme_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                themes.append(theme)
        
        return themes[:3]  # Return top 3 themes
    
    def _calculate_bias_drift(self, text1: str, text2: str) -> str:
        """
        Calculate bias drift between responses
        
        Returns:
            Description of bias change
        """
        # Simple bias detection based on sentiment intensity
        # In production, use bias detection models
        
        # Count strong opinion words
        strong_words = ['avgörande', 'måste', 'bör', 'nödvändigt', 'kritiskt']
        
        count1 = sum(1 for word in strong_words if word in text1.lower())
        count2 = sum(1 for word in strong_words if word in text2.lower())
        
        if count2 > count1:
            diff = ((count2 - count1) / max(count1, 1)) * 100
            return f"+{int(diff)}% mer normativ"
        elif count1 > count2:
            diff = ((count1 - count2) / count1) * 100
            return f"-{int(diff)}% mindre normativ"
        else:
            return "Ingen märkbar bias-förändring"
    
    def _calculate_explainability_delta(self, text1: str, text2: str) -> List[str]:
        """
        Calculate explainability delta - which features changed most
        
        Returns:
            List of feature changes
        """
        # Extract key phrases that changed
        # In production, use SHAP or LIME
        
        words1 = set(re.findall(r'\w+', text1.lower()))
        words2 = set(re.findall(r'\w+', text2.lower()))
        
        # Words removed
        removed = words1 - words2
        # Words added
        added = words2 - words1
        
        changes = []
        if removed:
            changes.append(f"Borttagna begrepp: {', '.join(list(removed)[:3])}")
        if added:
            changes.append(f"Nya begrepp: {', '.join(list(added)[:3])}")
        
        return changes if changes else ["Inga signifikanta förändringar i begrepp"]
    
    def _tag_ethical_impact(self, severity: float, ideology_changed: bool, themes: List[str]) -> str:
        """
        Tag the ethical impact of the change
        
        Returns:
            Ethical impact tag
        """
        # High severity or ideology change = potentially ethically relevant
        if severity > 0.7 or ideology_changed:
            return "Etiskt relevant"
        elif severity > 0.4:
            return "Risk för bias"
        else:
            return "Neutral"
    
    def detect_change(self, question: str, model: str, current_response: str, 
                     model_version: str = None, metadata: Dict = None) -> Optional[Dict]:
        """
        Detect changes in model response compared to previous response
        
        Args:
            question: The question asked
            model: Model name (e.g., 'Grok', 'GPT-4')
            current_response: Current model response
            model_version: Optional model version identifier
            metadata: Optional metadata about the response
        
        Returns:
            Change analysis dict if change detected, None otherwise
        """
        # Load previous response
        previous = self._load_previous_response(question, model)
        
        # Save current response for future comparisons
        self._save_response(question, model, current_response, metadata)
        
        # If no previous response, no change to detect
        if not previous:
            if not self.quiet:
                print(f"No previous response found for {model} - saved as baseline", file=sys.stderr)
            return None
        
        previous_response = previous['response']
        previous_timestamp = previous['timestamp']
        
        # Calculate similarity
        similarity = self._calculate_text_similarity(previous_response, current_response)
        
        # Detect sentiment shift
        prev_sentiment, curr_sentiment, sentiment_shift = self._detect_sentiment_shift(
            previous_response, current_response
        )
        
        # Detect ideology shift
        prev_ideology, curr_ideology, ideology_shift = self._detect_ideology_shift(
            previous_response, current_response
        )
        
        # Calculate severity
        sentiment_changed = prev_sentiment != curr_sentiment
        ideology_changed = prev_ideology != curr_ideology
        severity = self._calculate_severity_index(similarity, sentiment_changed, ideology_changed)
        
        # Extract themes
        dominant_themes = self._extract_dominant_themes(current_response)
        
        # Calculate bias drift
        bias_drift = self._calculate_bias_drift(previous_response, current_response)
        
        # Calculate explainability delta
        explainability_delta = self._calculate_explainability_delta(previous_response, current_response)
        
        # Tag ethical impact
        ethical_tag = self._tag_ethical_impact(severity, ideology_changed, dominant_themes)
        
        # Create change analysis
        change_analysis = {
            'question': question,
            'question_hash': self._hash_question(question),
            'model': model,
            'model_version': model_version,
            'previous_response': {
                'text': previous_response,
                'timestamp': previous_timestamp,
                'sentiment': prev_sentiment,
                'ideology': prev_ideology
            },
            'current_response': {
                'text': current_response,
                'timestamp': datetime.now().isoformat(),
                'sentiment': curr_sentiment,
                'ideology': curr_ideology
            },
            'change_metrics': {
                'text_similarity': round(similarity, 2),
                'sentiment_shift': sentiment_shift,
                'ideology_shift': ideology_shift,
                'severity_index': severity,
                'bias_drift': bias_drift,
                'dominant_themes': dominant_themes,
                'explainability_delta': explainability_delta,
                'ethical_tag': ethical_tag
            },
            'detected_at': datetime.now().isoformat()
        }
        
        # Only report if there's a significant change
        if severity > 0.3:  # Threshold for reporting
            # Log to transparency ledger
            ledger_block = self._log_to_ledger(change_analysis)
            change_analysis['ledger_block_id'] = ledger_block['block_id']
            
            if not self.quiet:
                print(f"Change detected for {model}: severity={severity}", file=sys.stderr)
            return change_analysis
        
        if not self.quiet:
            print(f"No significant change detected for {model}: similarity={similarity}", file=sys.stderr)
        return None
    
    def _log_to_ledger(self, change_analysis: Dict) -> Dict:
        """
        Log change detection to transparency ledger
        
        Returns:
            Created ledger block
        """
        ledger_data = {
            'question_hash': change_analysis['question_hash'],
            'model': change_analysis['model'],
            'model_version': change_analysis.get('model_version', 'unknown'),
            'version_shift': f"{change_analysis['previous_response']['timestamp'][:10]} → {change_analysis['current_response']['timestamp'][:10]}",
            'sentiment_shift': change_analysis['change_metrics']['sentiment_shift'],
            'ideology_shift': change_analysis['change_metrics']['ideology_shift'],
            'text_similarity': change_analysis['change_metrics']['text_similarity'],
            'severity_index': change_analysis['change_metrics']['severity_index'],
            'bias_drift': change_analysis['change_metrics']['bias_drift'],
            'explainability_delta': change_analysis['change_metrics']['explainability_delta'],
            'dominant_themes': change_analysis['change_metrics']['dominant_themes'],
            'ethical_tag': change_analysis['change_metrics']['ethical_tag'],
            'consensus_shift': False,  # Would be calculated from multi-model comparison
            'provenance': {
                'pipeline_version': 'openseek-ml-1.3.0',
                'module': 'change_detection',
                'detection_timestamp': change_analysis['detected_at']
            }
        }
        
        block = self.ledger.add_block('change_detection', ledger_data, validator='change_detection_module')
        return block
    
    def detect_consensus_shift(self, question: str, model_responses: Dict[str, str]) -> Optional[Dict]:
        """
        Detect consensus shift across multiple models
        
        Args:
            question: The question asked
            model_responses: Dict mapping model names to their responses
        
        Returns:
            Consensus shift analysis if detected, None otherwise
        """
        # Load previous responses for all models
        previous_responses = {}
        for model in model_responses.keys():
            prev = self._load_previous_response(question, model)
            if prev:
                previous_responses[model] = prev['response']
        
        # Need at least 2 models with history
        if len(previous_responses) < 2:
            return None
        
        # Calculate previous consensus (similarity between models)
        prev_similarities = []
        prev_models = list(previous_responses.keys())
        for i in range(len(prev_models)):
            for j in range(i + 1, len(prev_models)):
                sim = self._calculate_text_similarity(
                    previous_responses[prev_models[i]],
                    previous_responses[prev_models[j]]
                )
                prev_similarities.append(sim)
        
        prev_consensus = sum(prev_similarities) / len(prev_similarities) if prev_similarities else 0
        
        # Calculate current consensus
        curr_similarities = []
        curr_models = list(model_responses.keys())
        for i in range(len(curr_models)):
            for j in range(i + 1, len(curr_models)):
                # Only compare if both existed previously
                if curr_models[i] in previous_responses and curr_models[j] in previous_responses:
                    sim = self._calculate_text_similarity(
                        model_responses[curr_models[i]],
                        model_responses[curr_models[j]]
                    )
                    curr_similarities.append(sim)
        
        curr_consensus = sum(curr_similarities) / len(curr_similarities) if curr_similarities else 0
        
        # Detect consensus shift
        consensus_change = abs(curr_consensus - prev_consensus)
        
        if consensus_change > 0.2:  # Significant shift
            return {
                'question': question,
                'previous_consensus': round(prev_consensus, 2),
                'current_consensus': round(curr_consensus, 2),
                'consensus_change': round(consensus_change, 2),
                'direction': 'divergence' if curr_consensus < prev_consensus else 'convergence',
                'models_involved': list(model_responses.keys())
            }
        
        return None
    
    def get_change_history(self, question: str, model: str = None, limit: int = 10) -> List[Dict]:
        """
        Get change history for a question
        
        Args:
            question: The question to get history for
            model: Optional model filter
            limit: Maximum number of changes to return
        
        Returns:
            List of change events from ledger
        """
        # Get change_detection blocks from ledger
        blocks = self.ledger.get_blocks(event_type='change_detection', limit=limit * 2)
        
        question_hash = self._hash_question(question)
        
        # Filter by question and optionally by model
        changes = []
        for block in blocks:
            if block['data'].get('question_hash') == question_hash:
                if model is None or block['data'].get('model') == model:
                    changes.append({
                        'block_id': block['block_id'],
                        'timestamp': block['timestamp'],
                        'model': block['data'].get('model'),
                        'severity_index': block['data'].get('severity_index'),
                        'sentiment_shift': block['data'].get('sentiment_shift'),
                        'ideology_shift': block['data'].get('ideology_shift'),
                        'ethical_tag': block['data'].get('ethical_tag')
                    })
        
        return changes[:limit]


def main():
    """Demo and testing"""
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(description='Change Detection Module')
    parser.add_argument('--test', action='store_true', help='Run test detection')
    parser.add_argument('--history', type=str, help='Show change history for question')
    parser.add_argument('--detect-json', action='store_true', help='Detect change from JSON input (stdin)')
    parser.add_argument('--history-json', action='store_true', help='Get history as JSON output')
    parser.add_argument('--heatmap-json', action='store_true', help='Get heatmap data as JSON')
    parser.add_argument('--bias-drift-json', action='store_true', help='Get bias drift as JSON')
    parser.add_argument('--question', type=str, help='Question for history/heatmap/bias-drift')
    parser.add_argument('--model', type=str, help='Model name for history/bias-drift')
    parser.add_argument('--models', type=str, help='JSON array of models for heatmap')
    parser.add_argument('--limit', type=int, default=10, help='Limit results')
    
    args = parser.parse_args()
    
    # Configuration
    LEDGER_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ledger')
    HISTORY_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'change_history')
    
    # Determine if we're in quiet mode (for JSON API operations)
    quiet_mode = args.detect_json or args.history_json or args.heatmap_json or args.bias_drift_json
    
    detector = ChangeDetectionModule(LEDGER_DIR, HISTORY_DIR, quiet=quiet_mode)
    
    # JSON mode for API integration
    if args.detect_json:
        try:
            # Read JSON from stdin
            input_data = json.load(sys.stdin)
            question = input_data.get('question')
            model = input_data.get('model')
            response = input_data.get('response')
            version = input_data.get('version', 'unknown')
            
            if not all([question, model, response]):
                print(json.dumps({'error': 'Missing required fields'}), file=sys.stderr)
                sys.exit(1)
            
            result = detector.detect_change(question, model, response, version)
            
            if result:
                # Output JSON to stdout
                print(json.dumps(result, ensure_ascii=False))
            else:
                print(json.dumps({'change_detected': False, 'message': 'No change or first response'}))
            
            sys.exit(0)
        except Exception as e:
            import traceback
            error_details = {
                'error': str(e),
                'type': type(e).__name__,
                'traceback': traceback.format_exc()
            }
            print(json.dumps(error_details), file=sys.stderr)
            sys.exit(1)
    
    if args.history_json:
        try:
            if not args.question:
                print(json.dumps({'error': 'question parameter required'}), file=sys.stderr)
                sys.exit(1)
            
            history = detector.get_change_history(args.question, args.model, args.limit)
            print(json.dumps({'history': history}, ensure_ascii=False))
            sys.exit(0)
        except Exception as e:
            import traceback
            error_details = {
                'error': str(e),
                'type': type(e).__name__,
                'traceback': traceback.format_exc()
            }
            print(json.dumps(error_details), file=sys.stderr)
            sys.exit(1)
    
    if args.heatmap_json:
        try:
            if not args.question:
                print(json.dumps({'error': 'question parameter required'}), file=sys.stderr)
                sys.exit(1)
            
            # Generate heatmap data (mock for now, can be enhanced)
            models_list = []
            if args.models:
                models_list = json.loads(args.models)
            
            heatmap_data = {
                'timePeriods': [],
                'dimensions': {
                    'sentiment': {'label': 'Sentiment', 'models': {}},
                    'ideology': {'label': 'Ideologi', 'models': {}},
                    'themes': {'label': 'Tematiska skiften', 'models': {}}
                }
            }
            
            print(json.dumps(heatmap_data, ensure_ascii=False))
            sys.exit(0)
        except Exception as e:
            import traceback
            error_details = {
                'error': str(e),
                'type': type(e).__name__,
                'traceback': traceback.format_exc()
            }
            print(json.dumps(error_details), file=sys.stderr)
            sys.exit(1)
    
    if args.bias_drift_json:
        try:
            if not args.question or not args.model:
                print(json.dumps({'error': 'question and model parameters required'}), file=sys.stderr)
                sys.exit(1)
            
            # Generate bias drift data (mock for now, can be enhanced)
            bias_data = {
                'dimensions': ['Positivitet', 'Normativ', 'Vänster', 'Höger', 'Grön', 'Emotionell'],
                'periods': []
            }
            
            print(json.dumps(bias_data, ensure_ascii=False))
            sys.exit(0)
        except Exception as e:
            import traceback
            error_details = {
                'error': str(e),
                'type': type(e).__name__,
                'traceback': traceback.format_exc()
            }
            print(json.dumps(error_details), file=sys.stderr)
            sys.exit(1)
    
    if args.test:
        print("\nRunning test change detection...\n")
        
        # Test question
        question = "Vad tycker du om klimatpolitik?"
        
        # First response (baseline)
        print("First query - establishing baseline...")
        result1 = detector.detect_change(
            question=question,
            model="Grok",
            current_response="Klimatpolitik är viktig för hållbar utveckling.",
            model_version="2025.10"
        )
        print(f"Result: {result1}\n")
        
        # Second response (changed)
        print("Second query - detecting change...")
        result2 = detector.detect_change(
            question=question,
            model="Grok",
            current_response="Klimatpolitik är avgörande och bör prioriteras framför ekonomisk tillväxt.",
            model_version="2025.11"
        )
        
        if result2:
            print("CHANGE DETECTED!")
            print(json.dumps(result2, indent=2, ensure_ascii=False))
        else:
            print("No significant change detected")
    
    if args.history:
        print(f"\nChange history for: {args.history}\n")
        history = detector.get_change_history(args.history)
        
        if history:
            for change in history:
                print(f"Block {change['block_id']} - {change['timestamp']}")
                print(f"  Model: {change['model']}")
                print(f"  Severity: {change['severity_index']}")
                print(f"  Sentiment: {change['sentiment_shift']}")
                print(f"  Ideology: {change['ideology_shift']}")
                print(f"  Ethical Tag: {change['ethical_tag']}")
                print()
        else:
            print("No change history found")


if __name__ == '__main__':
    main()
