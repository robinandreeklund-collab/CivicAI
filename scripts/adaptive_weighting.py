#!/usr/bin/env python3
"""
Adaptive Weighting Module for OneSeek-7B-Zero
Models compete based on validation loss - best performers get increased focus

Features:
- Dynamic weight adjustment based on validation performance
- Best model gets up to 2.0x focus
- Worst model gets reduced focus
- Automatic normalization to sum=1.0
"""

import json
from typing import Dict, Tuple


def calculate_adaptive_weights(
    val_losses: Dict[str, float],
    current_weights: Dict[str, float] = None,
    best_bonus: float = 0.5,
    worst_penalty: float = 0.4,
    min_weight: float = 0.3,
    max_weight: float = 2.0
) -> Tuple[Dict[str, float], Dict[str, dict]]:
    """
    Calculate adaptive weights based on validation losses
    
    Args:
        val_losses: Dict of {model_name: validation_loss}
        current_weights: Current model weights (defaults to equal weights)
        best_bonus: Bonus multiplier for best model (0.0-1.0)
        worst_penalty: Penalty multiplier for worst model (0.0-1.0)
        min_weight: Minimum allowed weight
        max_weight: Maximum allowed weight
    
    Returns:
        Tuple of (new_weights, adjustment_info)
        - new_weights: Dict of {model_name: normalized_weight}
        - adjustment_info: Dict of {model_name: {old, new, change, reason}}
    """
    if not val_losses:
        return {}, {}
    
    # Initialize current weights if not provided
    if current_weights is None:
        current_weights = {name: 1.0 for name in val_losses.keys()}
    
    # Find best and worst performing models
    sorted_models = sorted(val_losses.items(), key=lambda x: x[1])
    best_model = sorted_models[0][0]
    worst_model = sorted_models[-1][0]
    
    # Calculate new weights
    new_weights = {}
    adjustment_info = {}
    
    for model_name, loss in val_losses.items():
        old_weight = current_weights.get(model_name, 1.0)
        
        if model_name == best_model:
            # Increase weight for best performer
            new_weight = old_weight * (1.0 + best_bonus)
            reason = f"Best performer (loss={loss:.4f}): +{best_bonus*100:.0f}%"
        elif model_name == worst_model:
            # Decrease weight for worst performer
            new_weight = old_weight * (1.0 - worst_penalty)
            reason = f"Worst performer (loss={loss:.4f}): -{worst_penalty*100:.0f}%"
        else:
            # Keep weight for middle performers
            new_weight = old_weight
            reason = f"Mid-tier performer (loss={loss:.4f}): no change"
        
        # Clamp to min/max bounds
        new_weight = max(min_weight, min(max_weight, new_weight))
        
        new_weights[model_name] = new_weight
        adjustment_info[model_name] = {
            'old_weight': old_weight,
            'new_weight': new_weight,
            'change': new_weight - old_weight,
            'change_percent': ((new_weight - old_weight) / old_weight * 100) if old_weight > 0 else 0,
            'loss': loss,
            'reason': reason
        }
    
    # Normalize weights to sum to 1.0
    total_weight = sum(new_weights.values())
    if total_weight > 0:
        new_weights = {name: weight / total_weight for name, weight in new_weights.items()}
        
        # Update normalized values in adjustment info
        for model_name in adjustment_info:
            adjustment_info[model_name]['normalized_weight'] = new_weights[model_name]
    
    return new_weights, adjustment_info


def get_weight_multipliers(weights: Dict[str, float]) -> Dict[str, float]:
    """
    Convert normalized weights to multipliers relative to equal weighting
    
    Args:
        weights: Normalized weights (sum=1.0)
    
    Returns:
        Dict of {model_name: multiplier}
    """
    if not weights:
        return {}
    
    n_models = len(weights)
    equal_weight = 1.0 / n_models
    
    return {
        name: weight / equal_weight
        for name, weight in weights.items()
    }


def format_leaderboard(val_losses: Dict[str, float], weights: Dict[str, float]) -> str:
    """
    Format leaderboard display with rankings and weights
    
    Args:
        val_losses: Validation losses
        weights: Model weights
    
    Returns:
        str: Formatted leaderboard string
    """
    multipliers = get_weight_multipliers(weights)
    
    # Sort by validation loss (ascending)
    sorted_models = sorted(val_losses.items(), key=lambda x: x[1])
    
    lines = ["LIVE LEADERBOARD", "=" * 50]
    
    for rank, (model_name, loss) in enumerate(sorted_models, 1):
        weight = weights.get(model_name, 0.0)
        multiplier = multipliers.get(model_name, 1.0)
        
        # Create progress bar (max 20 chars)
        bar_length = int(multiplier * 10)
        bar = "█" * bar_length
        
        line = f"{rank}. {model_name:<30} {multiplier:.2f}x  {bar}"
        lines.append(line)
    
    return "\n".join(lines)


def main():
    """Command-line interface for testing adaptive weighting"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Calculate adaptive model weights')
    parser.add_argument('--losses', type=str, required=True, help='JSON dict of validation losses')
    parser.add_argument('--current-weights', type=str, help='JSON dict of current weights')
    parser.add_argument('--best-bonus', type=float, default=0.5, help='Bonus for best model (0.0-1.0)')
    parser.add_argument('--worst-penalty', type=float, default=0.4, help='Penalty for worst model (0.0-1.0)')
    parser.add_argument('--show-leaderboard', action='store_true', help='Show formatted leaderboard')
    
    args = parser.parse_args()
    
    # Parse inputs
    try:
        val_losses = json.loads(args.losses)
    except json.JSONDecodeError as e:
        print(f"Error parsing losses JSON: {e}")
        return 1
    
    current_weights = None
    if args.current_weights:
        try:
            current_weights = json.loads(args.current_weights)
        except json.JSONDecodeError as e:
            print(f"Error parsing weights JSON: {e}")
            return 1
    
    # Calculate new weights
    new_weights, adjustment_info = calculate_adaptive_weights(
        val_losses,
        current_weights,
        best_bonus=args.best_bonus,
        worst_penalty=args.worst_penalty
    )
    
    # Output results
    print(json.dumps({
        'new_weights': new_weights,
        'multipliers': get_weight_multipliers(new_weights),
        'adjustments': adjustment_info
    }, indent=2))
    
    # Show leaderboard if requested
    if args.show_leaderboard:
        print("\n" + format_leaderboard(val_losses, new_weights))
    
    return 0


if __name__ == '__main__':
    import sys
    sys.exit(main())
