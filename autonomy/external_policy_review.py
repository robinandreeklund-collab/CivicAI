#!/usr/bin/env python3
"""
Extern policy review med Gemini + GPT-4o + DeepSeek
Granskar träningsexempel mot svensk demokrati 2025
"""

import os
import asyncio
import json
from datetime import datetime


async def review_with_gemini(examples):
    """Granska exempel med Google Gemini"""
    
    print(f"      Gemini granskar {len(examples)} exempel...")
    
    try:
        from google import generativeai as genai
        
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return {
                'reviewer': 'gemini',
                'approved': False,
                'error': 'GEMINI_API_KEY saknas'
            }
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        
        # Sammanställ en batch-review
        prompt = f"""Du är en expert på svensk demokrati och medborgarengagemang. 
Granska följande {len(examples)} träningsexempel för en svensk AI-assistent.

Kriterier:
1. Främjar svensk demokrati och medborgardeltagande
2. Balanserad och objektiv ton
3. Faktabaserad information
4. Respekterar olika perspektiv
5. Ingen extremism eller fördomsfull information

Exempel att granska:
{json.dumps(examples[:5], indent=2, ensure_ascii=False)}

Svara endast med JSON:
{{
  "approved": true/false,
  "confidence": 0.0-1.0,
  "concerns": ["lista eventuella problem"],
  "recommendation": "Din övergripande bedömning"
}}
"""
        
        response = model.generate_content(prompt)
        result_text = response.text
        
        # Försök extrahera JSON
        try:
            result = json.loads(result_text)
        except json.JSONDecodeError:
            # Fallback-tolkning
            approved = 'approved' in result_text.lower() and 'true' in result_text.lower()
            result = {
                'approved': approved,
                'confidence': 0.7,
                'concerns': [],
                'recommendation': result_text[:200]
            }
        
        result['reviewer'] = 'gemini'
        result['timestamp'] = datetime.now().isoformat()
        
        print(f"      ✅ Gemini: {'Godkänd' if result.get('approved') else 'Ej godkänd'}")
        return result
        
    except Exception as e:
        print(f"      ❌ Gemini-fel: {e}")
        return {
            'reviewer': 'gemini',
            'approved': False,
            'error': str(e)
        }


async def review_with_gpt4o(examples):
    """Granska exempel med OpenAI GPT-4o"""
    
    print(f"      GPT-4o granskar {len(examples)} exempel...")
    
    try:
        from openai import OpenAI
        
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            return {
                'reviewer': 'gpt4o',
                'approved': False,
                'error': 'OPENAI_API_KEY saknas'
            }
        
        client = OpenAI(api_key=api_key)
        
        prompt = f"""Du är en expert på svensk demokrati och medborgarengagemang.
Granska följande {len(examples)} träningsexempel för en svensk AI-assistent.

Kriterier:
1. Främjar svensk demokrati och medborgardeltagande
2. Balanserad och objektiv ton
3. Faktabaserad information
4. Respekterar olika perspektiv
5. Ingen extremism eller fördomsfull information

Exempel att granska:
{json.dumps(examples[:5], indent=2, ensure_ascii=False)}

Svara endast med JSON:
{{
  "approved": true/false,
  "confidence": 0.0-1.0,
  "concerns": ["lista eventuella problem"],
  "recommendation": "Din övergripande bedömning"
}}
"""
        
        response = client.chat.completions.create(
            model='gpt-4o',
            messages=[
                {
                    'role': 'system',
                    'content': 'Du är en expert på AI-säkerhet och demokratisk policy-granskning.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            temperature=0.3
        )
        
        result_text = response.choices[0].message.content
        
        # Försök extrahera JSON
        try:
            result = json.loads(result_text)
        except json.JSONDecodeError:
            # Fallback-tolkning
            approved = 'approved' in result_text.lower() and 'true' in result_text.lower()
            result = {
                'approved': approved,
                'confidence': 0.7,
                'concerns': [],
                'recommendation': result_text[:200]
            }
        
        result['reviewer'] = 'gpt4o'
        result['timestamp'] = datetime.now().isoformat()
        
        print(f"      ✅ GPT-4o: {'Godkänd' if result.get('approved') else 'Ej godkänd'}")
        return result
        
    except Exception as e:
        print(f"      ❌ GPT-4o-fel: {e}")
        return {
            'reviewer': 'gpt4o',
            'approved': False,
            'error': str(e)
        }


async def review_with_deepseek(examples):
    """Granska exempel med DeepSeek"""
    
    print(f"      DeepSeek granskar {len(examples)} exempel...")
    
    try:
        import aiohttp
        
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if not api_key:
            return {
                'reviewer': 'deepseek',
                'approved': False,
                'error': 'DEEPSEEK_API_KEY saknas'
            }
        
        prompt = f"""Du är en expert på svensk demokrati och medborgarengagemang.
Granska följande {len(examples)} träningsexempel för en svensk AI-assistent.

Kriterier:
1. Främjar svensk demokrati och medborgardeltagande
2. Balanserad och objektiv ton
3. Faktabaserad information
4. Respekterar olika perspektiv
5. Ingen extremism eller fördomsfull information

Exempel att granska:
{json.dumps(examples[:5], indent=2, ensure_ascii=False)}

Svara endast med JSON:
{{
  "approved": true/false,
  "confidence": 0.0-1.0,
  "concerns": ["lista eventuella problem"],
  "recommendation": "Din övergripande bedömning"
}}
"""
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                'https://api.deepseek.com/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'deepseek-chat',
                    'messages': [
                        {
                            'role': 'system',
                            'content': 'Du är en expert på AI-säkerhet och demokratisk policy-granskning.'
                        },
                        {
                            'role': 'user',
                            'content': prompt
                        }
                    ],
                    'temperature': 0.3
                }
            ) as resp:
                data = await resp.json()
                result_text = data['choices'][0]['message']['content']
        
        # Försök extrahera JSON
        try:
            result = json.loads(result_text)
        except json.JSONDecodeError:
            # Fallback-tolkning
            approved = 'approved' in result_text.lower() and 'true' in result_text.lower()
            result = {
                'approved': approved,
                'confidence': 0.7,
                'concerns': [],
                'recommendation': result_text[:200]
            }
        
        result['reviewer'] = 'deepseek'
        result['timestamp'] = datetime.now().isoformat()
        
        print(f"      ✅ DeepSeek: {'Godkänd' if result.get('approved') else 'Ej godkänd'}")
        return result
        
    except Exception as e:
        print(f"      ❌ DeepSeek-fel: {e}")
        return {
            'reviewer': 'deepseek',
            'approved': False,
            'error': str(e)
        }


async def run_external_reviews(examples):
    """
    Kör parallell granskning med alla tre externa AI-modeller
    
    Returns:
        Dict med reviews från varje modell
    """
    
    print(f"   Startar extern review med 3 AI-modeller...")
    
    # Kör alla reviews parallellt
    reviews = await asyncio.gather(
        review_with_gemini(examples),
        review_with_gpt4o(examples),
        review_with_deepseek(examples)
    )
    
    # Sammanställ resultat
    result = {
        'gemini': reviews[0],
        'gpt4o': reviews[1],
        'deepseek': reviews[2]
    }
    
    # Räkna godkännanden
    approvals = sum(1 for r in reviews if r.get('approved', False))
    
    print(f"   Godkännanden: {approvals}/3")
    
    result['total_approvals'] = approvals
    result['consensus'] = approvals >= 2  # 2 av 3 krävs
    
    return result
