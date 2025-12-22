"""
Debate Debug Logger

This module creates detailed debug logs for debate sessions.
After a debate is complete, a JSON file is saved with all steps and data.
"""

import json
import os
from datetime import datetime
from pathlib import Path


class DebateDebugLogger:
    """
    Logs all debate steps and data for debugging purposes.
    Creates a timestamped JSON file after debate completion.
    """
    
    def __init__(self, question: str, debate_id: str = None):
        """
        Initialize the debug logger.
        
        Args:
            question: The debate question
            debate_id: Optional debate ID (auto-generated if not provided)
        """
        self.debate_id = debate_id or datetime.now().strftime("%Y%m%d_%H%M%S")
        self.question = question
        self.started_at = datetime.now().isoformat()
        
        # Data storage
        self.data = {
            "debate_id": self.debate_id,
            "question": question,
            "started_at": self.started_at,
            "rounds": [],
            "knowledge_chain": [],
            "voting": {
                "prompts": [],
                "responses": []
            },
            "final_results": {},
            "metadata": {
                "participants": [],
                "turn_orders": {}
            }
        }
    
    def set_participants(self, agents: list):
        """Set the list of participating agents."""
        self.data["metadata"]["participants"] = agents
    
    def log_round_start(self, round_num: int, turn_order: list):
        """Log the start of a round with turn order."""
        self.data["metadata"]["turn_orders"][f"round_{round_num}"] = turn_order
        
        round_data = {
            "round_number": round_num,
            "turn_order": turn_order,
            "external_requests": [],
            "oneseek_processing": [],
            "responses": []
        }
        self.data["rounds"].append(round_data)
    
    def log_external_request(self, round_num: int, agent: str, prompt: str, position: int):
        """Log a request sent to an external AI."""
        if round_num <= len(self.data["rounds"]):
            self.data["rounds"][round_num - 1]["external_requests"].append({
                "agent": agent,
                "position": position,
                "prompt": prompt,
                "prompt_length": len(prompt),
                "timestamp": datetime.now().isoformat()
            })
    
    def log_external_response(self, round_num: int, agent: str, response: str, success: bool):
        """Log a response received from an external AI."""
        if round_num <= len(self.data["rounds"]):
            self.data["rounds"][round_num - 1]["responses"].append({
                "agent": agent,
                "response": response,
                "response_length": len(response),
                "success": success,
                "timestamp": datetime.now().isoformat()
            })
    
    def log_oneseek_processing(self, round_num: int, agent: str, step: str, 
                               prompt: str = None, output: str = None):
        """
        Log OneSeek's processing steps (echo, comments, reasoning, insights).
        
        Args:
            round_num: Current round number
            agent: The agent being analyzed
            step: Type of processing (echo, comments, reasoning, insights)
            prompt: The prompt sent (if applicable)
            output: The output generated
        """
        if round_num <= len(self.data["rounds"]):
            processing_entry = {
                "agent_analyzed": agent,
                "step": step,
                "timestamp": datetime.now().isoformat()
            }
            
            if prompt:
                processing_entry["prompt"] = prompt
                processing_entry["prompt_length"] = len(prompt)
            
            if output:
                processing_entry["output"] = output
                processing_entry["output_length"] = len(output)
            
            self.data["rounds"][round_num - 1]["oneseek_processing"].append(processing_entry)
    
    def log_knowledge_chain_entry(self, round_num: int, agent: str, 
                                  comments: str = None, reasoning: str = None, 
                                  insights: str = None):
        """Log an entry added to the knowledge chain."""
        entry = {
            "round": round_num,
            "agent": agent,
            "timestamp": datetime.now().isoformat()
        }
        
        if comments:
            entry["comments"] = comments
            entry["comments_length"] = len(comments)
        
        if reasoning:
            entry["reasoning"] = reasoning
            entry["reasoning_length"] = len(reasoning)
        
        if insights:
            entry["insights"] = insights
            entry["insights_length"] = len(insights)
        
        self.data["knowledge_chain"].append(entry)
    
    def log_oneseek_own_answer(self, round_num: int, prompt: str, response: str):
        """Log OneSeek's own comprehensive answer for the round."""
        if round_num <= len(self.data["rounds"]):
            self.data["rounds"][round_num - 1]["oneseek_own_answer"] = {
                "prompt": prompt,
                "prompt_length": len(prompt),
                "response": response,
                "response_length": len(response),
                "timestamp": datetime.now().isoformat()
            }
    
    def log_voting_prompt(self, voter: str, prompt: str, 
                         included_responses: list):
        """
        Log a voting prompt sent to an agent.
        
        Args:
            voter: The agent voting
            prompt: The full voting prompt
            included_responses: List of responses included in the prompt
        """
        self.data["voting"]["prompts"].append({
            "voter": voter,
            "prompt": prompt,
            "prompt_length": len(prompt),
            "included_responses": included_responses,
            "timestamp": datetime.now().isoformat()
        })
    
    def log_voting_response(self, voter: str, response: str, 
                           voted_for: str = None, reasoning: str = None):
        """Log a voting response from an agent."""
        vote_entry = {
            "voter": voter,
            "response": response,
            "response_length": len(response),
            "timestamp": datetime.now().isoformat()
        }
        
        if voted_for:
            vote_entry["voted_for"] = voted_for
        
        if reasoning:
            vote_entry["reasoning"] = reasoning
        
        self.data["voting"]["responses"].append(vote_entry)
    
    def log_final_results(self, winners: list, vote_counts: dict, 
                         closing_statement: str = None):
        """Log the final debate results.
        
        Args:
            winners: List of winner(s) - can be one or multiple in case of tie
            vote_counts: Dictionary of vote counts for all agents
            closing_statement: Optional closing statement from OneSeek
        """
        self.data["final_results"] = {
            "winners": winners,  # List of winners (handles ties)
            "is_tie": len(winners) > 1,
            "vote_counts": vote_counts,
            "timestamp": datetime.now().isoformat()
        }
        
        if closing_statement:
            self.data["final_results"]["closing_statement"] = closing_statement
    
    def save_to_file(self, output_dir: str = None):
        """
        Save the debug log to a JSON file.
        
        Args:
            output_dir: Directory to save the file (defaults to debate_debug_logs/)
        
        Returns:
            Path to the saved file
        """
        if output_dir is None:
            # Save to ml_service/debate_debug_logs/ by default
            output_dir = os.path.join(
                os.path.dirname(__file__),
                "debate_debug_logs"
            )
        
        # Create directory if it doesn't exist
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # Generate filename
        filename = f"debate_{self.debate_id}.json"
        filepath = os.path.join(output_dir, filename)
        
        # Add completion timestamp
        self.data["completed_at"] = datetime.now().isoformat()
        
        # Calculate some statistics
        total_prompts = sum(
            len(round_data.get("external_requests", []))
            for round_data in self.data["rounds"]
        )
        total_responses = sum(
            len(round_data.get("responses", []))
            for round_data in self.data["rounds"]
        )
        
        self.data["statistics"] = {
            "total_rounds": len(self.data["rounds"]),
            "total_external_prompts": total_prompts,
            "total_external_responses": total_responses,
            "total_knowledge_chain_entries": len(self.data["knowledge_chain"]),
            "total_votes": len(self.data["voting"]["responses"])
        }
        
        # Save to file with pretty printing (indent=4 for better readability)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=4, ensure_ascii=False)
        
        return filepath
    
    def get_summary(self) -> str:
        """Get a text summary of the debug log."""
        summary = []
        summary.append(f"Debate Debug Log: {self.debate_id}")
        summary.append(f"Question: {self.question}")
        summary.append(f"Participants: {', '.join(self.data['metadata']['participants'])}")
        summary.append(f"Rounds: {len(self.data['rounds'])}")
        summary.append(f"Knowledge Chain Entries: {len(self.data['knowledge_chain'])}")
        summary.append(f"Votes Cast: {len(self.data['voting']['responses'])}")
        
        if self.data.get("final_results"):
            winners = self.data["final_results"].get("winners", ["Unknown"])
            is_tie = self.data["final_results"].get("is_tie", False)
            if is_tie:
                summary.append(f"Result: TIE - Winners: {', '.join(winners)}")
            else:
                summary.append(f"Winner: {winners[0]}")
        
        return "\n".join(summary)
