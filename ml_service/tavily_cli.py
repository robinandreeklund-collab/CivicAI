#!/usr/bin/env python3
"""
CLI wrapper for Tavily search - designed to be called from Node.js
"""

import sys
import json
import argparse
from tavily_search import search_with_sources

def main():
    parser = argparse.ArgumentParser(description='Tavily Search CLI')
    parser.add_argument('--query', type=str, required=True, help='Search query')
    parser.add_argument('--mode', type=str, default='search', choices=['search', 'swedish'], help='Search mode')
    
    args = parser.parse_args()
    
    try:
        # Perform search
        result = search_with_sources(args.query)
        
        # Output as JSON
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)
    except Exception as e:
        # Output error as JSON
        error_result = {
            'answer': None,
            'sources': '',
            'raw_data': None,
            'language': 'sv',
            'error': str(e)
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == '__main__':
    main()
