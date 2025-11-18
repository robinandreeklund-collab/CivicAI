#!/usr/bin/env python3
"""
OQT-1.0 Real-Time Update Pipeline
Handles continuous monitoring and incremental updates
"""

import json
import time
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List
import hashlib

class RealtimeUpdater:
    """Manages real-time model updates and monitoring"""
    
    def __init__(self, data_dir: str, model_dir: str, update_threshold: int = 100):
        self.data_dir = Path(data_dir)
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.update_threshold = update_threshold
        self.processed_files = set()
        self.metrics_history = []
        
        # Load processed files tracking
        self.tracking_file = self.model_dir / 'processed_tracking.json'
        self._load_tracking()
    
    def _load_tracking(self):
        """Load tracking of processed files"""
        if self.tracking_file.exists():
            with open(self.tracking_file, 'r') as f:
                data = json.load(f)
                self.processed_files = set(data.get('processed_files', []))
                self.metrics_history = data.get('metrics_history', [])
    
    def _save_tracking(self):
        """Save tracking of processed files"""
        with open(self.tracking_file, 'w') as f:
            json.dump({
                'processed_files': list(self.processed_files),
                'metrics_history': self.metrics_history,
                'last_update': datetime.now().isoformat()
            }, f, indent=2)
    
    def get_new_interactions(self) -> List[Dict]:
        """Get interactions that haven't been processed yet"""
        new_interactions = []
        
        if not self.data_dir.exists():
            return new_interactions
        
        for file in self.data_dir.glob("interaction-*.json"):
            file_name = file.name
            if file_name not in self.processed_files:
                try:
                    with open(file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        new_interactions.append({
                            'file': file_name,
                            'data': data
                        })
                except Exception as e:
                    print(f"Error loading {file}: {e}")
        
        return new_interactions
    
    def calculate_metrics(self, interactions: List[Dict]) -> Dict:
        """Calculate current metrics from interactions"""
        if not interactions:
            return {
                'total_interactions': 0,
                'avg_consensus': 0.0,
                'bias_rate': 0.0,
                'avg_responses': 0.0
            }
        
        total = len(interactions)
        consensus_scores = []
        bias_count = 0
        response_counts = []
        
        for item in interactions:
            data = item.get('data', {})
            
            # Consensus score
            consensus = data.get('analysis', {}).get('consensus_score')
            if consensus is not None:
                consensus_scores.append(consensus)
            
            # Bias detection
            if data.get('analysis', {}).get('bias_detected'):
                bias_count += 1
            
            # Response count
            responses = data.get('responses', [])
            response_counts.append(len(responses))
        
        metrics = {
            'total_interactions': total,
            'avg_consensus': sum(consensus_scores) / len(consensus_scores) if consensus_scores else 0.0,
            'bias_rate': bias_count / total if total > 0 else 0.0,
            'avg_responses': sum(response_counts) / len(response_counts) if response_counts else 0.0
        }
        
        return metrics
    
    def check_update_needed(self, new_count: int) -> bool:
        """Check if model update is needed based on new data"""
        return new_count >= self.update_threshold
    
    def trigger_micro_update(self, interactions: List[Dict]) -> Dict:
        """Trigger a micro-batch update"""
        print(f"\n{'=' * 60}")
        print(f"Triggering micro-batch update with {len(interactions)} new interactions")
        print(f"{'=' * 60}")
        
        # Calculate metrics
        metrics = self.calculate_metrics(interactions)
        
        # In production, this would trigger actual model fine-tuning
        # For now, we simulate the update
        update_record = {
            'timestamp': datetime.now().isoformat(),
            'interaction_count': len(interactions),
            'metrics': metrics,
            'update_type': 'micro_batch',
            'status': 'completed'
        }
        
        # Log metrics
        self.metrics_history.append(update_record)
        
        # Mark files as processed
        for item in interactions:
            self.processed_files.add(item['file'])
        
        self._save_tracking()
        
        # Save update record
        update_file = self.model_dir / f"update_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(update_file, 'w') as f:
            json.dump(update_record, f, indent=2)
        
        print(f"\nUpdate completed successfully")
        print(f"Metrics:")
        print(f"  Average Consensus: {metrics['avg_consensus']:.3f}")
        print(f"  Bias Rate: {metrics['bias_rate']:.3f}")
        print(f"  Avg Responses: {metrics['avg_responses']:.1f}")
        
        return update_record
    
    def monitor_performance(self) -> Dict:
        """Monitor current model performance"""
        if not self.metrics_history:
            return {'status': 'no_data'}
        
        # Get recent metrics
        recent = self.metrics_history[-10:]
        
        # Calculate trends
        consensus_trend = [m['metrics']['avg_consensus'] for m in recent]
        bias_trend = [m['metrics']['bias_rate'] for m in recent]
        
        performance = {
            'timestamp': datetime.now().isoformat(),
            'recent_updates': len(recent),
            'consensus_trend': {
                'current': consensus_trend[-1] if consensus_trend else 0.0,
                'average': sum(consensus_trend) / len(consensus_trend) if consensus_trend else 0.0,
                'improving': consensus_trend[-1] > consensus_trend[0] if len(consensus_trend) > 1 else None
            },
            'bias_trend': {
                'current': bias_trend[-1] if bias_trend else 0.0,
                'average': sum(bias_trend) / len(bias_trend) if bias_trend else 0.0,
                'improving': bias_trend[-1] < bias_trend[0] if len(bias_trend) > 1 else None
            }
        }
        
        return performance
    
    def run_monitoring_loop(self, interval: int = 60, max_iterations: int = None):
        """
        Run continuous monitoring loop
        
        Args:
            interval: Check interval in seconds
            max_iterations: Max iterations (None for infinite)
        """
        print(f"Starting real-time monitoring (interval: {interval}s)")
        print(f"Update threshold: {self.update_threshold} interactions")
        print(f"{'=' * 60}\n")
        
        iteration = 0
        while True:
            iteration += 1
            
            if max_iterations and iteration > max_iterations:
                break
            
            # Check for new data
            new_interactions = self.get_new_interactions()
            
            if new_interactions:
                print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] "
                      f"Found {len(new_interactions)} new interactions")
                
                # Check if update needed
                if self.check_update_needed(len(new_interactions)):
                    self.trigger_micro_update(new_interactions)
                else:
                    print(f"  Waiting for {self.update_threshold - len(new_interactions)} "
                          f"more interactions before update")
            
            # Monitor performance
            performance = self.monitor_performance()
            if performance.get('status') != 'no_data':
                print(f"\n[Performance Monitor]")
                print(f"  Consensus: {performance['consensus_trend']['current']:.3f} "
                      f"(avg: {performance['consensus_trend']['average']:.3f})")
                print(f"  Bias Rate: {performance['bias_trend']['current']:.3f} "
                      f"(avg: {performance['bias_trend']['average']:.3f})")
            
            # Sleep until next check
            if max_iterations is None or iteration < max_iterations:
                time.sleep(interval)
        
        print("\nMonitoring stopped")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='OQT-1.0 Real-time Update Pipeline')
    parser.add_argument('--interval', type=int, default=60,
                        help='Monitoring interval in seconds (default: 60)')
    parser.add_argument('--threshold', type=int, default=100,
                        help='Update threshold (default: 100 interactions)')
    parser.add_argument('--iterations', type=int, default=None,
                        help='Max iterations (default: infinite)')
    
    args = parser.parse_args()
    
    # Configuration
    DATA_DIR = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        'backend', 'data', 'oqt-interactions'
    )
    MODEL_DIR = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'models', 'oqt-1.0'
    )
    
    # Run monitoring
    updater = RealtimeUpdater(DATA_DIR, MODEL_DIR, args.threshold)
    updater.run_monitoring_loop(args.interval, args.iterations)


if __name__ == '__main__':
    main()
