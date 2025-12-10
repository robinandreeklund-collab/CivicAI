"""
Debug WebSocket Client för Personality Pipeline
================================================
Skickar debug-meddelanden till fristående debug-terminal
"""

import json
import logging
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Global WebSocket-anslutning
_debug_ws = None
_debug_enabled = False
_debug_session_id = None


async def connect_to_debug_terminal():
    """Anslut till debug-terminalen"""
    global _debug_ws, _debug_enabled
    
    try:
        import websockets
        _debug_ws = await websockets.connect("ws://localhost:5001")
        _debug_enabled = True
        logger.info("✓ Connected to debug terminal on ws://localhost:5001")
        return True
    except Exception as e:
        logger.warning(f"Could not connect to debug terminal: {e}")
        logger.warning("Debug terminal not available. Run: python debug_personality_pipeline.py")
        _debug_enabled = False
        return False


async def send_debug_message(msg_type: str, data: Dict[str, Any] = None):
    """
    Skicka debug-meddelande till debug-terminalen
    
    Args:
        msg_type: Typ av meddelande (session_start, personality_selection, etc.)
        data: Extra data att skicka
    """
    global _debug_ws, _debug_enabled
    
    if not _debug_enabled or not _debug_ws:
        return
    
    try:
        message = {
            "type": msg_type,
            "timestamp": datetime.now().isoformat(),
            "session_id": _debug_session_id,
            **(data or {})
        }
        
        await _debug_ws.send(json.dumps(message, ensure_ascii=False))
    except Exception as e:
        logger.warning(f"Failed to send debug message: {e}")
        _debug_enabled = False


def enable_debug_mode():
    """Aktivera debug-läge"""
    global _debug_enabled
    _debug_enabled = True


def disable_debug_mode():
    """Inaktivera debug-läge"""
    global _debug_enabled
    _debug_enabled = False


def is_debug_enabled():
    """Kontrollera om debug är aktiverat"""
    return _debug_enabled


def start_debug_session(query: str) -> str:
    """
    Starta ny debug-session
    
    Args:
        query: Användarens fråga
        
    Returns:
        Session ID
    """
    global _debug_session_id
    import uuid
    _debug_session_id = str(uuid.uuid4())[:8]
    return _debug_session_id


# Convenience-funktioner för vanliga meddelanden

async def debug_session_start(query: str):
    """Skicka session start-meddelande"""
    session_id = start_debug_session(query)
    await send_debug_message("session_start", {
        "query": query,
        "session_id": session_id
    })


async def debug_personality_selection(personality_name: str, confidence: float, candidates: list = None):
    """Skicka personality selection-meddelande"""
    await send_debug_message("personality_selection", {
        "personality_name": personality_name,
        "confidence": confidence,
        "candidates": candidates or []
    })


async def debug_api_map_created(personality: str, api_count: int, tags: list = None):
    """Skicka API map created-meddelande"""
    await send_debug_message("api_map_created", {
        "personality": personality,
        "api_count": api_count,
        "tags": tags or []
    })


async def debug_first_inference_start(prompt: str, model: str = "oneseek-7b-zero", max_tokens: int = 256):
    """Skicka första inferensen start-meddelande"""
    await send_debug_message("first_inference_start", {
        "prompt": prompt,
        "model": model,
        "max_tokens": max_tokens
    })


async def debug_first_inference_response(response: str, latency_ms: float, shown_to_user: bool = False):
    """Skicka första inferensen response-meddelande"""
    await send_debug_message("first_inference_response", {
        "response": response,
        "latency_ms": latency_ms,
        "shown_to_user": shown_to_user
    })


async def debug_api_selection_parsed(apis: list):
    """Skicka API selection parsed-meddelande"""
    await send_debug_message("api_selection_parsed", {
        "apis": apis
    })


async def debug_api_fetch_start(api_count: int, concurrent_limit: int = 5):
    """Skicka API fetch start-meddelande"""
    await send_debug_message("api_fetch_start", {
        "api_count": api_count,
        "concurrent_limit": concurrent_limit
    })


async def debug_api_fetch_result(api_name: str, success: bool, source: str = None, data: dict = None, error: str = None, latency_ms: float = 0):
    """Skicka API fetch result-meddelande"""
    await send_debug_message("api_fetch_result", {
        "api_name": api_name,
        "success": success,
        "source": source,
        "data": data,
        "error": error,
        "latency_ms": latency_ms
    })


async def debug_api_fetch_complete(successful: int, total: int):
    """Skicka API fetch complete-meddelande"""
    await send_debug_message("api_fetch_complete", {
        "successful": successful,
        "total": total
    })


async def debug_second_inference_start(personality: str, has_api_data: bool, system_prompt: str, model: str = "oneseek-7b-zero", max_tokens: int = 512):
    """Skicka andra inferensen start-meddelande"""
    await send_debug_message("second_inference_start", {
        "personality": personality,
        "has_api_data": has_api_data,
        "system_prompt": system_prompt,
        "model": model,
        "max_tokens": max_tokens
    })


async def debug_second_inference_response(response: str, latency_ms: float, tokens_per_sec: float = 0):
    """Skicka andra inferensen response-meddelande"""
    await send_debug_message("second_inference_response", {
        "response": response,
        "latency_ms": latency_ms,
        "tokens_per_sec": tokens_per_sec
    })


async def debug_response_sent(total_time_ms: float):
    """Skicka response sent-meddelande"""
    await send_debug_message("response_sent", {
        "total_time_ms": total_time_ms
    })


async def debug_error(step: str, error: str):
    """Skicka error-meddelande"""
    await send_debug_message("error", {
        "step": step,
        "error": error
    })


async def debug_warning(message: str):
    """Skicka warning-meddelande"""
    await send_debug_message("warning", {
        "message": message
    })
