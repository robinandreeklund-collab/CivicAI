#!/usr/bin/env python3
"""
Admin CLI for CivicAI Runtime Configuration
Allows administrators to configure and switch between local and RunPod execution modes.

Usage:
    python scripts/admin_cli.py show-config
    python scripts/admin_cli.py set-mode local
    python scripts/admin_cli.py set-mode runpod
    python scripts/admin_cli.py set-runpod-credentials
    python scripts/admin_cli.py test-connection
"""

import sys
import argparse
from pathlib import Path
import logging

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.runtime_config import get_config_manager
from ml_service.runpod_client import create_runpod_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def print_header(text: str):
    """Print a formatted header."""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")


def print_success(text: str):
    """Print success message."""
    print(f"✓ {text}")


def print_error(text: str):
    """Print error message."""
    print(f"✗ {text}", file=sys.stderr)


def print_info(text: str):
    """Print info message."""
    print(f"  {text}")


def show_config(args):
    """Show current configuration."""
    print_header("Current Runtime Configuration")
    
    config_manager = get_config_manager()
    config_dict = config_manager.get_display_info()
    
    print(f"Execution Mode: {config_dict['mode'].upper()}")
    print()
    
    if config_dict['mode'] == 'runpod':
        print("RunPod Settings:")
        print(f"  API Key:      {config_dict.get('runpod_api_key', 'Not set')}")
        print(f"  Endpoint URL: {config_dict.get('runpod_endpoint_url', 'Not set')}")
        print(f"  Timeout:      {config_dict.get('runpod_timeout', 300)}s")
        print(f"  Max Retries:  {config_dict.get('runpod_max_retries', 3)}")
    else:
        print("Local Mode: Models will be executed on this machine")
    
    print()


def set_mode(args):
    """Set execution mode."""
    mode = args.mode.lower()
    
    if mode not in ['local', 'runpod']:
        print_error(f"Invalid mode: {mode}. Must be 'local' or 'runpod'")
        return 1
    
    print_header(f"Setting Execution Mode to {mode.upper()}")
    
    config_manager = get_config_manager()
    success, error = config_manager.set_mode(mode)
    
    if success:
        print_success(f"Execution mode set to {mode}")
        print()
        
        if mode == 'runpod':
            config = config_manager.get_config()
            if not config.runpod_api_key or not config.runpod_endpoint_url:
                print_info("⚠ Warning: RunPod credentials not configured")
                print_info("Run 'python scripts/admin_cli.py set-runpod-credentials' to configure")
                print()
        
        return 0
    else:
        print_error(f"Failed to set mode: {error}")
        return 1


def set_runpod_credentials(args):
    """Set RunPod API credentials."""
    print_header("Configure RunPod Credentials")
    
    # Prompt for API key
    if args.api_key:
        api_key = args.api_key
    else:
        print("Enter your RunPod API key:")
        print("(You can find this at https://www.runpod.io/console/user/settings)")
        api_key = input("API Key: ").strip()
    
    if not api_key:
        print_error("API key cannot be empty")
        return 1
    
    # Prompt for endpoint URL
    if args.endpoint_url:
        endpoint_url = args.endpoint_url
    else:
        print("\nEnter your RunPod endpoint URL:")
        print("(e.g., https://api.runpod.ai/v2/your-endpoint-id)")
        endpoint_url = input("Endpoint URL: ").strip()
    
    if not endpoint_url:
        print_error("Endpoint URL cannot be empty")
        return 1
    
    # Validate URL format
    if not endpoint_url.startswith(('http://', 'https://')):
        print_error("Endpoint URL must start with http:// or https://")
        return 1
    
    # Save credentials
    config_manager = get_config_manager()
    success, error = config_manager.set_runpod_credentials(api_key, endpoint_url)
    
    if success:
        print()
        print_success("RunPod credentials saved successfully")
        print()
        
        # Test connection if requested
        if not args.no_test:
            print_info("Testing connection to RunPod endpoint...")
            test_result = test_connection(None, api_key, endpoint_url)
            return test_result
        
        return 0
    else:
        print_error(f"Failed to save credentials: {error}")
        return 1


def test_connection(args, api_key=None, endpoint_url=None):
    """Test connection to RunPod endpoint."""
    print_header("Testing RunPod Connection")
    
    config_manager = get_config_manager()
    config = config_manager.get_config()
    
    # Use provided credentials or get from config
    api_key = api_key or config.runpod_api_key
    endpoint_url = endpoint_url or config.runpod_endpoint_url
    
    if not api_key or not endpoint_url:
        print_error("RunPod credentials not configured")
        print_info("Run 'python scripts/admin_cli.py set-runpod-credentials' to configure")
        return 1
    
    try:
        print_info(f"Connecting to {endpoint_url}...")
        
        client = create_runpod_client(
            api_key=api_key,
            endpoint_url=endpoint_url,
            timeout=config.runpod_timeout,
            max_retries=1  # Don't retry for test
        )
        
        is_connected, error = client.test_connection()
        
        if is_connected:
            print_success("Connection successful!")
            print_info("RunPod endpoint is accessible and ready")
            print()
            return 0
        else:
            print_error(f"Connection failed: {error}")
            print()
            return 1
            
    except Exception as e:
        print_error(f"Connection test failed: {str(e)}")
        print()
        return 1


def set_timeout(args):
    """Set RunPod request timeout."""
    timeout = args.timeout
    
    if timeout < 1:
        print_error("Timeout must be at least 1 second")
        return 1
    
    print_header(f"Setting RunPod Timeout to {timeout}s")
    
    config_manager = get_config_manager()
    success, error = config_manager.update_config(runpod_timeout=timeout)
    
    if success:
        print_success(f"Timeout set to {timeout} seconds")
        print()
        return 0
    else:
        print_error(f"Failed to set timeout: {error}")
        return 1


def set_max_retries(args):
    """Set RunPod max retries."""
    retries = args.retries
    
    if retries < 0:
        print_error("Max retries must be non-negative")
        return 1
    
    print_header(f"Setting RunPod Max Retries to {retries}")
    
    config_manager = get_config_manager()
    success, error = config_manager.update_config(runpod_max_retries=retries)
    
    if success:
        print_success(f"Max retries set to {retries}")
        print()
        return 0
    else:
        print_error(f"Failed to set max retries: {error}")
        return 1


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Admin CLI for CivicAI runtime configuration",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Show current configuration
  python scripts/admin_cli.py show-config
  
  # Switch to local mode
  python scripts/admin_cli.py set-mode local
  
  # Switch to RunPod mode
  python scripts/admin_cli.py set-mode runpod
  
  # Configure RunPod credentials (interactive)
  python scripts/admin_cli.py set-runpod-credentials
  
  # Configure RunPod credentials (non-interactive)
  python scripts/admin_cli.py set-runpod-credentials \\
    --api-key YOUR_API_KEY \\
    --endpoint-url https://api.runpod.ai/v2/your-endpoint
  
  # Test connection to RunPod
  python scripts/admin_cli.py test-connection
  
  # Set RunPod timeout
  python scripts/admin_cli.py set-timeout 600
  
  # Set max retries
  python scripts/admin_cli.py set-max-retries 5
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # show-config command
    subparsers.add_parser('show-config', help='Show current configuration')
    
    # set-mode command
    mode_parser = subparsers.add_parser('set-mode', help='Set execution mode')
    mode_parser.add_argument('mode', choices=['local', 'runpod'], help='Execution mode')
    
    # set-runpod-credentials command
    creds_parser = subparsers.add_parser('set-runpod-credentials', help='Set RunPod API credentials')
    creds_parser.add_argument('--api-key', help='RunPod API key')
    creds_parser.add_argument('--endpoint-url', help='RunPod endpoint URL')
    creds_parser.add_argument('--no-test', action='store_true', help='Skip connection test')
    
    # test-connection command
    subparsers.add_parser('test-connection', help='Test connection to RunPod endpoint')
    
    # set-timeout command
    timeout_parser = subparsers.add_parser('set-timeout', help='Set RunPod request timeout')
    timeout_parser.add_argument('timeout', type=int, help='Timeout in seconds')
    
    # set-max-retries command
    retries_parser = subparsers.add_parser('set-max-retries', help='Set RunPod max retries')
    retries_parser.add_argument('retries', type=int, help='Maximum number of retries')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    # Execute command
    commands = {
        'show-config': show_config,
        'set-mode': set_mode,
        'set-runpod-credentials': set_runpod_credentials,
        'test-connection': test_connection,
        'set-timeout': set_timeout,
        'set-max-retries': set_max_retries,
    }
    
    handler = commands.get(args.command)
    if handler:
        try:
            return handler(args)
        except KeyboardInterrupt:
            print("\n\nOperation cancelled by user")
            return 1
        except Exception as e:
            print_error(f"Unexpected error: {str(e)}")
            logger.exception("Command failed")
            return 1
    else:
        print_error(f"Unknown command: {args.command}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
