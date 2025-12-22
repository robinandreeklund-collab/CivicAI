#!/usr/bin/env python3
"""
Debate Debug Log Viewer

This script formats debate debug logs in a human-readable way.
Usage: python view_debug_log.py <log_file.json> [--truncate 500] [--section voting]
"""

import json
import sys
import argparse
from pathlib import Path
from datetime import datetime


class DebugLogViewer:
    """Format debate debug logs for easy reading."""
    
    def __init__(self, log_file: str, truncate: int = None):
        """
        Initialize viewer.
        
        Args:
            log_file: Path to the debug log JSON file
            truncate: Max characters for long text fields (None = no truncation)
        """
        self.log_file = log_file
        self.truncate = truncate
        
        with open(log_file, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
    
    def _truncate_text(self, text: str, label: str = "") -> str:
        """Truncate text if needed."""
        if not text:
            return ""
        
        if self.truncate and len(text) > self.truncate:
            return f"{text[:self.truncate]}... [{len(text) - self.truncate} more chars]"
        return text
    
    def _format_timestamp(self, ts: str) -> str:
        """Format ISO timestamp to readable form."""
        try:
            dt = datetime.fromisoformat(ts)
            return dt.strftime("%H:%M:%S")
        except:
            return ts
    
    def print_header(self):
        """Print debate header info."""
        print("=" * 80)
        print(f"DEBATE DEBUG LOG: {self.data['debate_id']}")
        print("=" * 80)
        print(f"Question: {self.data['question']}")
        print(f"Started: {self._format_timestamp(self.data['started_at'])}")
        print(f"Completed: {self._format_timestamp(self.data.get('completed_at', 'N/A'))}")
        print(f"Participants: {', '.join(self.data['metadata']['participants'])}")
        print()
    
    def print_statistics(self):
        """Print debate statistics."""
        stats = self.data.get('statistics', {})
        print("=" * 80)
        print("STATISTICS")
        print("=" * 80)
        print(f"Total Rounds: {stats.get('total_rounds', 0)}")
        print(f"External Prompts: {stats.get('total_external_prompts', 0)}")
        print(f"External Responses: {stats.get('total_external_responses', 0)}")
        print(f"Knowledge Chain Entries: {stats.get('total_knowledge_chain_entries', 0)}")
        print(f"Votes Cast: {stats.get('total_votes', 0)}")
        print()
    
    def print_rounds(self):
        """Print detailed round information."""
        for round_data in self.data['rounds']:
            round_num = round_data['round_number']
            turn_order = round_data['turn_order']
            
            print("=" * 80)
            print(f"ROUND {round_num}")
            print("=" * 80)
            print(f"Turn Order: {' → '.join(turn_order)}")
            print()
            
            # External AI requests and responses
            print(f"--- External AI Interactions ---")
            for req in round_data.get('external_requests', []):
                agent = req['agent'].upper()
                print(f"\n[{agent}] Request (position {req['position']})")
                print(f"  Time: {self._format_timestamp(req['timestamp'])}")
                print(f"  Prompt Length: {req['prompt_length']} chars")
                if self.truncate and self.truncate < 1000:
                    prompt = self._truncate_text(req['prompt'])
                    print(f"  Prompt: {prompt}")
            
            for resp in round_data.get('responses', []):
                agent = resp['agent'].upper()
                status = "✓" if resp['success'] else "✗"
                print(f"\n[{agent}] Response {status}")
                print(f"  Time: {self._format_timestamp(resp['timestamp'])}")
                print(f"  Length: {resp['response_length']} chars")
                response = self._truncate_text(resp['response'])
                print(f"  Text: {response}")
            
            # OneSeek processing
            if round_data.get('oneseek_processing'):
                print(f"\n--- OneSeek Processing ---")
                current_agent = None
                for proc in round_data['oneseek_processing']:
                    agent = proc.get('agent_analyzed', '')
                    step = proc['step']
                    
                    if agent and agent != current_agent:
                        print(f"\n[Analyzing {agent.upper()}]")
                        current_agent = agent
                    
                    print(f"  {step}:")
                    if 'prompt' in proc:
                        print(f"    Prompt: {proc['prompt_length']} chars")
                    if 'output' in proc:
                        output = self._truncate_text(proc['output'])
                        print(f"    Output: {output}")
            
            # OneSeek's own answer
            if 'oneseek_own_answer' in round_data:
                own = round_data['oneseek_own_answer']
                print(f"\n--- OneSeek's Answer ---")
                print(f"  Time: {self._format_timestamp(own['timestamp'])}")
                print(f"  Prompt Length: {own['prompt_length']} chars")
                print(f"  Response Length: {own['response_length']} chars")
                response = self._truncate_text(own['response'])
                print(f"  Answer: {response}")
            
            print()
    
    def print_knowledge_chain(self):
        """Print knowledge chain entries."""
        if not self.data.get('knowledge_chain'):
            return
        
        print("=" * 80)
        print("KNOWLEDGE CHAIN")
        print("=" * 80)
        
        for entry in self.data['knowledge_chain']:
            round_num = entry['round']
            agent = entry['agent'].upper()
            
            print(f"\n[Round {round_num} - {agent}]")
            print(f"  Time: {self._format_timestamp(entry['timestamp'])}")
            
            if 'comments' in entry:
                comments = self._truncate_text(entry['comments'])
                print(f"  Comments: {comments}")
            
            if 'reasoning' in entry:
                reasoning = self._truncate_text(entry['reasoning'])
                print(f"  Reasoning: {reasoning}")
            
            if 'insights' in entry:
                insights = self._truncate_text(entry['insights'])
                print(f"  Insights: 💡 {insights}")
        
        print()
    
    def print_voting(self):
        """Print voting phase details."""
        voting = self.data.get('voting', {})
        
        if not voting.get('prompts') and not voting.get('responses'):
            return
        
        print("=" * 80)
        print("VOTING PHASE")
        print("=" * 80)
        
        # Combine prompts and responses by voter
        prompts_by_voter = {p['voter']: p for p in voting.get('prompts', [])}
        responses_by_voter = {r['voter']: r for r in voting.get('responses', [])}
        
        all_voters = set(prompts_by_voter.keys()) | set(responses_by_voter.keys())
        
        for voter in sorted(all_voters):
            print(f"\n[{voter.upper()}]")
            
            if voter in prompts_by_voter:
                prompt_data = prompts_by_voter[voter]
                print(f"  Prompt Time: {self._format_timestamp(prompt_data['timestamp'])}")
                print(f"  Prompt Length: {prompt_data['prompt_length']} chars")
                print(f"  Included Responses: {', '.join(prompt_data['included_responses'])}")
                if self.truncate and self.truncate < 1000:
                    prompt = self._truncate_text(prompt_data['prompt'])
                    print(f"  Prompt: {prompt}")
            
            if voter in responses_by_voter:
                resp_data = responses_by_voter[voter]
                print(f"  Response Time: {self._format_timestamp(resp_data['timestamp'])}")
                print(f"  Response Length: {resp_data['response_length']} chars")
                
                if 'voted_for' in resp_data:
                    print(f"  ✓ Voted For: {resp_data['voted_for'].upper()}")
                else:
                    print(f"  ✗ Vote parsing failed")
                
                response = self._truncate_text(resp_data['response'])
                print(f"  Full Response: {response}")
                
                if 'reasoning' in resp_data:
                    reasoning = self._truncate_text(resp_data['reasoning'])
                    print(f"  Reasoning: {reasoning}")
        
        print()
    
    def print_results(self):
        """Print final results."""
        results = self.data.get('final_results', {})
        
        if not results:
            return
        
        print("=" * 80)
        print("FINAL RESULTS")
        print("=" * 80)
        
        winners = results.get('winners', [])
        is_tie = results.get('is_tie', False)
        vote_counts = results.get('vote_counts', {})
        
        if is_tie:
            print(f"🏆 TIE! Winners: {', '.join([w.upper() for w in winners])}")
        else:
            print(f"🏆 Winner: {winners[0].upper()}")
        
        print(f"\nVote Counts:")
        for agent, count in sorted(vote_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"  {agent.upper()}: {count} {'vote' if count == 1 else 'votes'}")
        
        if 'closing_statement' in results:
            print(f"\nClosing Statement:")
            statement = self._truncate_text(results['closing_statement'])
            print(f"  {statement}")
        
        print()
    
    def view_all(self):
        """Print complete formatted log."""
        self.print_header()
        self.print_statistics()
        self.print_rounds()
        self.print_knowledge_chain()
        self.print_voting()
        self.print_results()
    
    def view_section(self, section: str):
        """Print specific section only."""
        self.print_header()
        
        if section == 'stats':
            self.print_statistics()
        elif section == 'rounds':
            self.print_rounds()
        elif section == 'knowledge':
            self.print_knowledge_chain()
        elif section == 'voting':
            self.print_voting()
        elif section == 'results':
            self.print_results()
        else:
            print(f"Unknown section: {section}")
            print("Available sections: stats, rounds, knowledge, voting, results")


def main():
    parser = argparse.ArgumentParser(description='View debate debug logs in readable format')
    parser.add_argument('log_file', help='Path to debug log JSON file')
    parser.add_argument('--truncate', type=int, default=300, 
                       help='Max characters for long texts (default: 300, 0 = no limit)')
    parser.add_argument('--section', choices=['stats', 'rounds', 'knowledge', 'voting', 'results'],
                       help='Show only specific section')
    parser.add_argument('--full', action='store_true',
                       help='Show full text without truncation')
    
    args = parser.parse_args()
    
    if not Path(args.log_file).exists():
        print(f"Error: File not found: {args.log_file}")
        sys.exit(1)
    
    truncate = None if args.full or args.truncate == 0 else args.truncate
    
    viewer = DebugLogViewer(args.log_file, truncate=truncate)
    
    if args.section:
        viewer.view_section(args.section)
    else:
        viewer.view_all()


if __name__ == '__main__':
    main()
