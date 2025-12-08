#!/usr/bin/env python3
"""
Unified Training Module for CivicAI
Supports training on both local and RunPod environments.

This module provides a unified interface for model training that works transparently
with both local GPU resources and RunPod cloud infrastructure. Administrators can
switch between environments without changing the training workflow.

Usage:
    # Local training
    python ml/training/train.py --dataset data/train.jsonl --epochs 3
    
    # Training will automatically use the configured mode (local or runpod)
    # Check mode with: python scripts/admin_cli.py show-config
"""

import os
import sys
from pathlib import Path
import argparse
import logging
from typing import Dict, Optional
import json
import time

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from config.runtime_config import get_runtime_config, is_runpod_mode, is_local_mode
from ml_service.runpod_client import create_runpod_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class UnifiedTrainer:
    """
    Unified training interface that works with both local and RunPod environments.
    """
    
    def __init__(self):
        """Initialize trainer."""
        self.config = get_runtime_config()
        self.mode = self.config.mode
        logger.info(f"Trainer initialized in {self.mode.upper()} mode")
    
    def train(
        self,
        dataset_path: str,
        model_name: str = "mistralai/Mistral-7B-v0.1",
        epochs: int = 3,
        learning_rate: float = 2e-4,
        batch_size: int = 4,
        output_dir: Optional[str] = None,
        **kwargs
    ) -> Dict:
        """
        Train a model using configured environment.
        
        Args:
            dataset_path: Path to training dataset (local file or URL)
            model_name: Base model to fine-tune
            epochs: Number of training epochs
            learning_rate: Learning rate
            batch_size: Batch size
            output_dir: Output directory for trained model
            **kwargs: Additional training parameters
            
        Returns:
            Dict with training results and metadata
        """
        logger.info(f"Starting training in {self.mode} mode")
        logger.info(f"Dataset: {dataset_path}")
        logger.info(f"Model: {model_name}")
        logger.info(f"Epochs: {epochs}, LR: {learning_rate}, Batch: {batch_size}")
        
        if is_runpod_mode():
            return self._train_runpod(
                dataset_path, model_name, epochs, learning_rate, 
                batch_size, output_dir, **kwargs
            )
        else:
            return self._train_local(
                dataset_path, model_name, epochs, learning_rate,
                batch_size, output_dir, **kwargs
            )
    
    def _train_local(
        self,
        dataset_path: str,
        model_name: str,
        epochs: int,
        learning_rate: float,
        batch_size: int,
        output_dir: Optional[str],
        **kwargs
    ) -> Dict:
        """Train on local hardware."""
        logger.info("Starting LOCAL training")
        
        try:
            # Import local training module (optional - only needed for metrics)
            try:
                from ml.training.pytorch_trainer import write_live_metrics
            except ImportError:
                logger.warning("pytorch_trainer not available, metrics will not be logged")
                write_live_metrics = None
            
            # Determine output directory
            if output_dir is None:
                project_root = Path(__file__).parent.parent.parent
                output_dir = project_root / "models" / "oneseek-certified" / f"run-{int(time.time())}"
            else:
                output_dir = Path(output_dir)
            
            output_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Output directory: {output_dir}")
            
            # Verify dataset exists
            dataset_file = Path(dataset_path)
            if not dataset_file.exists():
                raise FileNotFoundError(f"Dataset not found: {dataset_path}")
            
            # Import torch and transformers
            import torch
            from transformers import (
                AutoModelForCausalLM,
                AutoTokenizer,
                TrainingArguments,
                Trainer,
                DataCollatorForLanguageModeling
            )
            from datasets import load_dataset
            
            logger.info("Loading model and tokenizer...")
            
            # Load tokenizer
            tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                trust_remote_code=True
            )
            
            # Ensure tokenizer has pad token
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
            
            # Load model
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                trust_remote_code=True,
                torch_dtype=torch.float16,
                device_map="auto"
            )
            
            logger.info("Loading dataset...")
            
            # Load dataset
            dataset = load_dataset('json', data_files=str(dataset_file))
            
            # Tokenize dataset
            def tokenize_function(examples):
                return tokenizer(
                    examples["text"] if "text" in examples else examples["prompt"],
                    truncation=True,
                    max_length=512,
                    padding="max_length"
                )
            
            tokenized_dataset = dataset.map(
                tokenize_function,
                batched=True,
                remove_columns=dataset["train"].column_names
            )
            
            # Training arguments
            training_args = TrainingArguments(
                output_dir=str(output_dir),
                num_train_epochs=epochs,
                per_device_train_batch_size=batch_size,
                learning_rate=learning_rate,
                logging_steps=10,
                save_strategy="epoch",
                report_to="none",
                fp16=True,
                **kwargs
            )
            
            # Data collator
            data_collator = DataCollatorForLanguageModeling(
                tokenizer=tokenizer,
                mlm=False
            )
            
            # Create trainer
            trainer = Trainer(
                model=model,
                args=training_args,
                train_dataset=tokenized_dataset["train"],
                data_collator=data_collator,
            )
            
            logger.info("Starting training...")
            start_time = time.time()
            
            # Train
            train_result = trainer.train()
            
            training_time = time.time() - start_time
            
            logger.info("Training completed!")
            logger.info(f"Training time: {training_time:.2f}s")
            
            # Save model
            logger.info("Saving model...")
            trainer.save_model(str(output_dir))
            tokenizer.save_pretrained(str(output_dir))
            
            # Save training metadata
            metadata = {
                "mode": "local",
                "model_name": model_name,
                "dataset": dataset_path,
                "epochs": epochs,
                "learning_rate": learning_rate,
                "batch_size": batch_size,
                "training_time_seconds": training_time,
                "final_loss": float(train_result.training_loss),
                "output_dir": str(output_dir)
            }
            
            with open(output_dir / "training_metadata.json", 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Model saved to {output_dir}")
            
            return metadata
            
        except Exception as e:
            logger.error(f"Local training failed: {e}", exc_info=True)
            raise RuntimeError(f"Local training failed: {str(e)}")
    
    def _train_runpod(
        self,
        dataset_path: str,
        model_name: str,
        epochs: int,
        learning_rate: float,
        batch_size: int,
        output_dir: Optional[str],
        **kwargs
    ) -> Dict:
        """Train on RunPod."""
        logger.info("Starting RUNPOD training")
        
        try:
            # Create RunPod client
            client = create_runpod_client(
                api_key=self.config.runpod_api_key,
                endpoint_url=self.config.runpod_endpoint_url,
                timeout=self.config.runpod_timeout,
                max_retries=self.config.runpod_max_retries
            )
            
            # For RunPod, dataset_path should be a URL accessible to RunPod
            # If it's a local file, we'd need to upload it first
            if not dataset_path.startswith(('http://', 'https://', 's3://')):
                logger.warning(f"Dataset path '{dataset_path}' appears to be local.")
                logger.warning("RunPod requires a URL. Consider uploading to S3 or making it accessible via HTTP.")
                raise ValueError(
                    "RunPod training requires dataset to be accessible via URL (http://, https://, or s3://)"
                )
            
            logger.info(f"Submitting training job to RunPod...")
            
            # Submit training job
            response = client.submit_training_job(
                dataset_url=dataset_path,
                model_name=model_name,
                epochs=epochs,
                learning_rate=learning_rate,
                batch_size=batch_size,
                **kwargs
            )
            
            if not response.success:
                raise RuntimeError(f"Failed to submit training job: {response.error}")
            
            job_id = response.data.get("id") or response.data.get("job_id")
            logger.info(f"Training job submitted: {job_id}")
            
            # Poll for job completion
            logger.info("Waiting for training to complete...")
            max_wait_time = 3600  # 1 hour max
            poll_interval = 30  # Check every 30 seconds
            waited = 0
            
            while waited < max_wait_time:
                status_response = client.check_job_status(job_id)
                
                if status_response.success:
                    status = status_response.data.get("status", "unknown")
                    logger.info(f"Job status: {status}")
                    
                    if status in ["COMPLETED", "completed", "success"]:
                        logger.info("Training completed successfully!")
                        
                        metadata = {
                            "mode": "runpod",
                            "model_name": model_name,
                            "dataset": dataset_path,
                            "epochs": epochs,
                            "learning_rate": learning_rate,
                            "batch_size": batch_size,
                            "job_id": job_id,
                            "status": status,
                            "result": status_response.data
                        }
                        
                        # Save metadata locally if output_dir specified
                        if output_dir:
                            output_path = Path(output_dir)
                            output_path.mkdir(parents=True, exist_ok=True)
                            with open(output_path / "training_metadata.json", 'w') as f:
                                json.dump(metadata, f, indent=2)
                        
                        return metadata
                    
                    elif status in ["FAILED", "failed", "error"]:
                        error_msg = status_response.data.get("error", "Unknown error")
                        raise RuntimeError(f"Training job failed: {error_msg}")
                
                time.sleep(poll_interval)
                waited += poll_interval
            
            # Timeout
            logger.warning(f"Training job {job_id} did not complete within {max_wait_time}s")
            return {
                "mode": "runpod",
                "job_id": job_id,
                "status": "timeout",
                "message": f"Job submitted but did not complete within {max_wait_time}s. Check status manually."
            }
            
        except Exception as e:
            logger.error(f"RunPod training failed: {e}", exc_info=True)
            raise RuntimeError(f"RunPod training failed: {str(e)}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Unified training for CivicAI (supports local and RunPod)",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        '--dataset',
        required=True,
        help='Path to training dataset (local file or URL for RunPod)'
    )
    parser.add_argument(
        '--model',
        default='mistralai/Mistral-7B-v0.1',
        help='Base model to fine-tune (default: mistralai/Mistral-7B-v0.1)'
    )
    parser.add_argument(
        '--epochs',
        type=int,
        default=3,
        help='Number of training epochs (default: 3)'
    )
    parser.add_argument(
        '--learning-rate',
        type=float,
        default=2e-4,
        help='Learning rate (default: 2e-4)'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=4,
        help='Batch size (default: 4)'
    )
    parser.add_argument(
        '--output-dir',
        help='Output directory for trained model'
    )
    
    args = parser.parse_args()
    
    try:
        # Create trainer
        trainer = UnifiedTrainer()
        
        # Run training
        result = trainer.train(
            dataset_path=args.dataset,
            model_name=args.model,
            epochs=args.epochs,
            learning_rate=args.learning_rate,
            batch_size=args.batch_size,
            output_dir=args.output_dir
        )
        
        # Print results
        print("\n" + "=" * 70)
        print("  Training Complete")
        print("=" * 70)
        print(json.dumps(result, indent=2))
        print()
        
        return 0
        
    except KeyboardInterrupt:
        print("\n\nTraining interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"Training failed: {e}", exc_info=True)
        print(f"\nError: {e}", file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
