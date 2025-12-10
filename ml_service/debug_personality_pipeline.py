#!/usr/bin/env python3
"""
ONESEEK Personality Pipeline Debugger
=====================================
Fristående debug-terminal som visar exakt vad som händer i personality-based API routing

Kör: python debug_personality_pipeline.py

Detta script lyssnar på WebSocket-anslutningar och visar live debug-information
från personality routing pipeline i en dedikerad terminal.
"""

import asyncio
import websockets
import json
import logging
from datetime import datetime
from colorama import init, Fore, Back, Style
import sys

# Initialize colorama for Windows-kompatibilitet
init(autoreset=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)


class PipelineDebugger:
    """Debug-terminal för personality pipeline"""
    
    def __init__(self):
        self.step_count = 0
        self.session_start = None
        self.current_query = None
        self.current_personality = None
        self.api_count = 0
        
    def clear_screen(self):
        """Rensa skärmen"""
        import os
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def print_header(self):
        """Visa header"""
        print(f"\n{Back.BLUE}{Fore.WHITE}{'='*80}{Style.RESET_ALL}")
        print(f"{Back.BLUE}{Fore.WHITE} ONESEEK PERSONALITY PIPELINE DEBUGGER {Style.RESET_ALL}")
        print(f"{Back.BLUE}{Fore.WHITE}{'='*80}{Style.RESET_ALL}\n")
        
        if self.session_start:
            elapsed = (datetime.now() - self.session_start).total_seconds()
            print(f"{Fore.CYAN}Session start: {self.session_start.strftime('%H:%M:%S')}{Style.RESET_ALL}")
            print(f"{Fore.CYAN}Elapsed: {elapsed:.1f}s{Style.RESET_ALL}")
            print(f"{Fore.CYAN}Steps: {self.step_count}{Style.RESET_ALL}\n")
    
    def print_step(self, step_name: str, message: str, data: dict = None, color=Fore.GREEN):
        """Visa ett pipeline-steg"""
        self.step_count += 1
        timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
        
        print(f"{Fore.YELLOW}[{timestamp}]{Style.RESET_ALL} {color}STEG {self.step_count}: {step_name}{Style.RESET_ALL}")
        print(f"  {Fore.WHITE}→ {message}{Style.RESET_ALL}")
        
        if data:
            print(f"  {Fore.CYAN}Data:{Style.RESET_ALL}")
            for key, value in data.items():
                if isinstance(value, (dict, list)):
                    print(f"    {Fore.MAGENTA}{key}:{Style.RESET_ALL} {json.dumps(value, ensure_ascii=False, indent=6)}")
                else:
                    print(f"    {Fore.MAGENTA}{key}:{Style.RESET_ALL} {value}")
        print()
    
    def print_error(self, message: str, error: str = None):
        """Visa felmeddelande"""
        print(f"{Back.RED}{Fore.WHITE} ❌ FEL: {message} {Style.RESET_ALL}")
        if error:
            print(f"  {Fore.RED}{error}{Style.RESET_ALL}\n")
    
    def print_warning(self, message: str):
        """Visa varning"""
        print(f"{Back.YELLOW}{Fore.BLACK} ⚠️  VARNING: {message} {Style.RESET_ALL}\n")
    
    def print_success(self, message: str):
        """Visa success-meddelande"""
        print(f"{Back.GREEN}{Fore.WHITE} ✅ SUCCESS: {message} {Style.RESET_ALL}\n")
    
    def print_divider(self):
        """Visa separator"""
        print(f"{Fore.BLUE}{'─'*80}{Style.RESET_ALL}\n")
    
    async def handle_debug_message(self, websocket, path):
        """Hantera inkommande debug-meddelanden från server"""
        client_addr = websocket.remote_address if hasattr(websocket, 'remote_address') else 'unknown'
        logger.info(f"New connection from {client_addr}")
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    msg_type = data.get('type', 'unknown')
                    
                    if msg_type == 'session_start':
                        self.clear_screen()
                        self.session_start = datetime.now()
                        self.step_count = 0
                        self.current_query = data.get('query')
                        self.print_header()
                        self.print_step(
                            "SESSION START",
                            f"Ny fråga mottagen",
                            {"query": self.current_query, "timestamp": self.session_start.isoformat()},
                            Fore.CYAN
                        )
                    
                    elif msg_type == 'personality_selection':
                        self.current_personality = data.get('personality_name')
                        self.print_step(
                            "PERSONALITY SELECTION",
                            "Embedding-matchning genomförd",
                            {
                                "selected": self.current_personality,
                                "confidence": data.get('confidence'),
                                "candidates": data.get('candidates', [])
                            },
                            Fore.MAGENTA
                        )
                    
                    elif msg_type == 'api_map_created':
                        self.api_count = data.get('api_count', 0)
                        self.print_step(
                            "API MAP CREATION",
                            "Character API-karta skapad",
                            {
                                "personality": self.current_personality,
                                "api_categories": data.get('api_count'),
                                "tags": data.get('tags', [])
                            },
                            Fore.BLUE
                        )
                    
                    elif msg_type == 'first_inference_start':
                        self.print_divider()
                        self.print_step(
                            "FÖRSTA INFERENSEN - START",
                            "Skickar unified prompt till modell",
                            {
                                "prompt_type": "personality + API selection",
                                "model": data.get('model'),
                                "max_tokens": data.get('max_tokens')
                            },
                            Fore.YELLOW
                        )
                        
                        # Visa prompten
                        if data.get('prompt'):
                            print(f"  {Fore.CYAN}PROMPT (första 500 tecken):{Style.RESET_ALL}")
                            print(f"  {Fore.WHITE}{data.get('prompt')[:500]}...{Style.RESET_ALL}\n")
                    
                    elif msg_type == 'first_inference_response':
                        self.print_step(
                            "FÖRSTA INFERENSEN - SVAR",
                            "Modellen returnerade JSON",
                            {
                                "response": data.get('response'),
                                "latency_ms": data.get('latency_ms')
                            },
                            Fore.YELLOW
                        )
                        
                        # Varning om JSON visas för användare
                        if data.get('shown_to_user'):
                            self.print_error(
                                "JSON visas för användaren!",
                                "Detta ska INTE hända - JSON ska vara intern"
                            )
                    
                    elif msg_type == 'api_selection_parsed':
                        selected_apis = data.get('apis', [])
                        self.print_step(
                            "API SELECTION PARSED",
                            f"Parsade {len(selected_apis)} valda API:er",
                            {
                                "apis": [f"{api.get('name')} ({api.get('params')})" for api in selected_apis]
                            },
                            Fore.GREEN
                        )
                    
                    elif msg_type == 'api_fetch_start':
                        self.print_divider()
                        self.print_step(
                            "API FETCH - START",
                            "Börjar hämta data från API:er parallellt",
                            {
                                "api_count": data.get('api_count'),
                                "concurrent_limit": data.get('concurrent_limit', 5)
                            },
                            Fore.CYAN
                        )
                    
                    elif msg_type == 'api_fetch_result':
                        api_name = data.get('api_name')
                        success = data.get('success')
                        
                        if success:
                            self.print_step(
                                f"API FETCH - {api_name}",
                                "✅ Data hämtad",
                                {
                                    "source": data.get('source'),
                                    "data_keys": list(data.get('data', {}).keys()) if data.get('data') else [],
                                    "latency_ms": data.get('latency_ms')
                                },
                                Fore.GREEN
                            )
                        else:
                            self.print_error(
                                f"API FETCH - {api_name} misslyckades",
                                data.get('error')
                            )
                    
                    elif msg_type == 'api_fetch_complete':
                        successful = data.get('successful', 0)
                        total = data.get('total', 0)
                        
                        if successful == total:
                            self.print_success(f"Alla {total} API:er lyckades")
                        else:
                            self.print_warning(f"Endast {successful}/{total} API:er lyckades")
                    
                    elif msg_type == 'second_inference_start':
                        self.print_divider()
                        self.print_step(
                            "ANDRA INFERENSEN - START",
                            "Skickar final prompt med personality + API data",
                            {
                                "personality": self.current_personality,
                                "api_data_included": data.get('has_api_data'),
                                "model": data.get('model'),
                                "max_tokens": data.get('max_tokens')
                            },
                            Fore.YELLOW
                        )
                        
                        # Visa system prompt
                        if data.get('system_prompt'):
                            print(f"  {Fore.CYAN}SYSTEM PROMPT (första 300 tecken):{Style.RESET_ALL}")
                            print(f"  {Fore.WHITE}{data.get('system_prompt')[:300]}...{Style.RESET_ALL}\n")
                    
                    elif msg_type == 'second_inference_response':
                        response = data.get('response', '')
                        self.print_step(
                            "ANDRA INFERENSEN - SVAR",
                            "Modellen genererade slutligt svar",
                            {
                                "response_length": len(response),
                                "latency_ms": data.get('latency_ms'),
                                "tokens_per_sec": data.get('tokens_per_sec')
                            },
                            Fore.YELLOW
                        )
                        
                        # Visa första 200 tecken av svaret
                        print(f"  {Fore.CYAN}SVAR (första 200 tecken):{Style.RESET_ALL}")
                        print(f"  {Fore.WHITE}{response[:200]}...{Style.RESET_ALL}\n")
                    
                    elif msg_type == 'response_sent':
                        self.print_divider()
                        self.print_success("Svar skickat till frontend")
                        
                        total_time = data.get('total_time_ms', 0)
                        print(f"  {Fore.CYAN}Total tid: {total_time/1000:.2f}s{Style.RESET_ALL}")
                        print(f"  {Fore.CYAN}Steg genomförda: {self.step_count}{Style.RESET_ALL}\n")
                    
                    elif msg_type == 'error':
                        self.print_error(
                            data.get('step', 'Unknown step'),
                            data.get('error')
                        )
                    
                    elif msg_type == 'warning':
                        self.print_warning(data.get('message'))
                    
                    else:
                        # Generic debug message
                        print(f"{Fore.WHITE}[DEBUG] {data.get('message', message)}{Style.RESET_ALL}\n")
                
                except json.JSONDecodeError:
                    print(f"{Fore.RED}Failed to parse JSON: {message}{Style.RESET_ALL}\n")
                except Exception as e:
                    print(f"{Fore.RED}Error processing message: {e}{Style.RESET_ALL}\n")
        
        except websockets.exceptions.ConnectionClosed:
            print(f"\n{Fore.YELLOW}Client {client_addr} disconnected{Style.RESET_ALL}\n")
        except Exception as e:
            print(f"\n{Fore.RED}Error with client {client_addr}: {e}{Style.RESET_ALL}\n")


async def main():
    """Start debug server"""
    debugger = PipelineDebugger()
    
    print(f"""
{Fore.CYAN}╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║           ONESEEK PERSONALITY PIPELINE DEBUGGER                            ║
║                                                                            ║
║  Lyssnar på: ws://localhost:5001                                          ║
║                                                                            ║
║  För att aktivera debug-meddelanden från server.py:                       ║
║  1. Starta denna debug-terminal först                                     ║
║  2. Sedan starta server.py med: python server.py --debug-pipeline         ║
║                                                                            ║
║  Tryck Ctrl+C för att avsluta                                             ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
{Style.RESET_ALL}
""")
    
    print(f"{Fore.GREEN}✓ Debug server startad{Style.RESET_ALL}")
    print(f"{Fore.GREEN}✓ Väntar på anslutningar från ml_service/server.py...{Style.RESET_ALL}\n")
    
    try:
        async with websockets.serve(debugger.handle_debug_message, "localhost", 5001):
            await asyncio.Future()  # Run forever
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Stänger av debug server...{Style.RESET_ALL}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Debug terminal avslutad{Style.RESET_ALL}")
        sys.exit(0)
