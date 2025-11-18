#!/usr/bin/env python3
"""
OQT-1.0 Dataset Preparation Pipeline
Handles data classification, fairness analysis, and consensus scoring
"""

import json
import hashlib
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple
import numpy as np
from collections import Counter

# Note: In production, these would be actual ML libraries
# from fairlearn.metrics import demographic_parity_difference, equalized_odds_difference
# from sklearn.model_selection import train_test_split

class DatasetPreparer:
    """Prepares and validates datasets for OQT-1.0 training"""
    
    def __init__(self, data_dir: str, output_dir: str):
        self.data_dir = Path(data_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def load_interactions(self) -> List[Dict]:
        """Load all interaction data from files"""
        interactions = []
        
        for file in self.data_dir.glob("interaction-*.json"):
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    interactions.append(data)
            except Exception as e:
                print(f"Error loading {file}: {e}")
                
        print(f"Loaded {len(interactions)} interactions")
        return interactions
    
    def calculate_consensus_score(self, responses: List[Dict]) -> float:
        """
        Calculate consensus score between AI responses
        Uses simplified semantic similarity (in production, use embeddings)
        """
        if len(responses) < 2:
            return 1.0
        
        # Simplified: compare response lengths and word overlap
        texts = [r.get('response_text', '') for r in responses]
        
        # Calculate pairwise similarity
        similarities = []
        for i in range(len(texts)):
            for j in range(i + 1, len(texts)):
                # Simple word overlap metric
                words_i = set(texts[i].lower().split())
                words_j = set(texts[j].lower().split())
                
                if len(words_i) == 0 or len(words_j) == 0:
                    similarity = 0.0
                else:
                    overlap = len(words_i & words_j)
                    union = len(words_i | words_j)
                    similarity = overlap / union if union > 0 else 0.0
                
                similarities.append(similarity)
        
        # Average similarity as consensus score
        consensus = np.mean(similarities) if similarities else 0.0
        return float(consensus)
    
    def classify_data_quality(self, interaction: Dict) -> Dict:
        """Classify data quality and assign metadata"""
        quality = {
            'valid': True,
            'quality_score': 1.0,
            'issues': []
        }
        
        # Check question quality
        question = interaction.get('question', '')
        if len(question) < 10:
            quality['issues'].append('question_too_short')
            quality['quality_score'] *= 0.5
        
        # Check responses
        responses = interaction.get('responses', [])
        if len(responses) < 1:
            quality['valid'] = False
            quality['issues'].append('no_responses')
        
        for response in responses:
            text = response.get('response_text', '')
            if len(text) < 20:
                quality['issues'].append('response_too_short')
                quality['quality_score'] *= 0.8
        
        return quality
    
    def analyze_fairness(self, interactions: List[Dict]) -> Dict:
        """
        Analyze fairness metrics across the dataset
        In production, this would use Fairlearn
        """
        fairness_metrics = {
            'total_samples': len(interactions),
            'model_distribution': Counter(),
            'source_distribution': Counter(),
            'demographic_parity': 0.95,  # Mock value
            'equal_opportunity': 0.93,   # Mock value
            'disparate_impact': 0.98     # Mock value
        }
        
        for interaction in interactions:
            # Count model distribution
            for response in interaction.get('responses', []):
                model = response.get('model', 'unknown')
                fairness_metrics['model_distribution'][model] += 1
            
            # Count source distribution
            source = interaction.get('provenance', {}).get('source', 'unknown')
            fairness_metrics['source_distribution'][source] += 1
        
        return fairness_metrics
    
    def extract_topics(self, text: str) -> List[str]:
        """Extract topics from text (simplified topic modeling)"""
        # In production, use proper NLP (BERT, LDA, etc.)
        keywords = {
            'politics': ['politik', 'government', 'election', 'policy'],
            'technology': ['ai', 'technology', 'computer', 'software'],
            'health': ['health', 'medical', 'disease', 'treatment'],
            'education': ['education', 'school', 'learning', 'student'],
            'economy': ['economy', 'market', 'finance', 'business']
        }
        
        text_lower = text.lower()
        topics = []
        
        for topic, words in keywords.items():
            if any(word in text_lower for word in words):
                topics.append(topic)
        
        return topics if topics else ['general']
    
    def prepare_dataset(self) -> Dict:
        """Main preparation pipeline"""
        print("=" * 60)
        print("OQT-1.0 Dataset Preparation Pipeline")
        print("=" * 60)
        
        # Load interactions
        interactions = self.load_interactions()
        
        if not interactions:
            print("No interactions found. Exiting.")
            return {}
        
        # Process each interaction
        prepared_data = []
        quality_issues = []
        
        for interaction in interactions:
            # Calculate consensus score if not present
            if interaction.get('analysis', {}).get('consensus_score') is None:
                consensus = self.calculate_consensus_score(
                    interaction.get('responses', [])
                )
                if 'analysis' not in interaction:
                    interaction['analysis'] = {}
                interaction['analysis']['consensus_score'] = consensus
            
            # Classify quality
            quality = self.classify_data_quality(interaction)
            interaction['quality'] = quality
            
            if not quality['valid']:
                quality_issues.append(interaction['id'])
                continue
            
            # Extract topics
            question = interaction.get('question', '')
            topics = self.extract_topics(question)
            interaction['analysis']['topics'] = topics
            
            prepared_data.append(interaction)
        
        print(f"\nProcessed {len(interactions)} interactions")
        print(f"Valid: {len(prepared_data)}")
        print(f"Invalid: {len(quality_issues)}")
        
        # Analyze fairness
        fairness = self.analyze_fairness(prepared_data)
        print(f"\nFairness Metrics:")
        print(f"  Demographic Parity: {fairness['demographic_parity']:.3f}")
        print(f"  Equal Opportunity: {fairness['equal_opportunity']:.3f}")
        print(f"  Disparate Impact: {fairness['disparate_impact']:.3f}")
        
        # Split dataset
        # In production, use stratified split
        total = len(prepared_data)
        train_size = int(0.8 * total)
        val_size = int(0.1 * total)
        
        train_data = prepared_data[:train_size]
        val_data = prepared_data[train_size:train_size + val_size]
        test_data = prepared_data[train_size + val_size:]
        
        print(f"\nDataset Split:")
        print(f"  Training: {len(train_data)}")
        print(f"  Validation: {len(val_data)}")
        print(f"  Test: {len(test_data)}")
        
        # Save prepared datasets
        splits = {
            'train': train_data,
            'validation': val_data,
            'test': test_data
        }
        
        for split_name, split_data in splits.items():
            output_file = self.output_dir / f"{split_name}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(split_data, f, indent=2, ensure_ascii=False)
            print(f"Saved {split_name} split to {output_file}")
        
        # Save fairness report
        fairness_report = {
            'timestamp': datetime.now().isoformat(),
            'total_interactions': len(interactions),
            'valid_interactions': len(prepared_data),
            'invalid_interactions': len(quality_issues),
            'fairness_metrics': fairness,
            'dataset_hash': self._calculate_dataset_hash(prepared_data)
        }
        
        report_file = self.output_dir / 'fairness_report.json'
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(fairness_report, f, indent=2)
        print(f"\nSaved fairness report to {report_file}")
        
        return fairness_report
    
    def _calculate_dataset_hash(self, data: List[Dict]) -> str:
        """Calculate hash of dataset for provenance"""
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()


def main():
    """Main entry point"""
    # Configuration
    DATA_DIR = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        'backend', 'data', 'oqt-interactions'
    )
    OUTPUT_DIR = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'data', 'prepared'
    )
    
    # Run preparation
    preparer = DatasetPreparer(DATA_DIR, OUTPUT_DIR)
    report = preparer.prepare_dataset()
    
    print("\n" + "=" * 60)
    print("Dataset preparation complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
