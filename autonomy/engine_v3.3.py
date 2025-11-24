#!/usr/bin/env python3
"""
OneSeek Autonomy Engine v3.3 - Huvudloop
Cron-runner för nattlig autonom självförbättring

Körschema: 03:00–06:15 varje natt
"""

import os
import sys
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
import asyncio

# Lägg till projektets rotkatalog till Python-sökvägen
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from autonomy.self_dataset_generator import generate_training_batch
from autonomy.external_policy_review import run_external_reviews
from autonomy.decision_gate import apply_decision_gate
from autonomy.auto_microtrain import run_microtraining
from autonomy.auto_verifier import run_self_verification
from autonomy.auto_promoter import promote_if_ready
from autonomy.human_checkpoint_generator import generate_checkpoint_questions


class AutonomyEngineV3:
    """
    OneSeek Autonomy Engine v3.3
    
    Kör en komplett nattlig självförbättringsloop:
    1. Själv-generering (03:00)
    2. Extern policy review (03:30)
    3. Intern analys Stage-1 + Stage-2 (03:45)
    4. Beslutsgate (04:00)
    5. Mikroträning 2-steg LoRA (04:15)
    6. Själv-verifiering 150 frågor (05:00)
    7. Auto-promotion om fidelity ≥ 98.5% (05:30)
    8. Human Golden Checkpoint (05:45)
    9. PoW-säkrad folkomröstning (06:00)
    10. Final aktivering (06:15)
    """
    
    def __init__(self, config_path=None):
        self.config = self.load_config(config_path)
        self.cycle_id = f"cycle-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        self.state = {
            'running': False,
            'current_stage': None,
            'start_time': None,
            'results': {}
        }
        
    def load_config(self, config_path):
        """Ladda autonomy-konfiguration"""
        if config_path is None:
            config_path = project_root / 'config' / 'autonomy.json'
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
        except FileNotFoundError:
            # Standardkonfiguration
            config = {
                'enabled': False,
                'schedule_time': '03:00',
                'min_fidelity_threshold': 0.985,  # 98.5%
                'max_examples_per_night': 600,
                'min_examples_per_night': 50,
                'verification_questions': 150,
                'force_human_checkpoint': True,
                'auto_promotion_enabled': True
            }
        
        return config
    
    def save_state(self):
        """Spara aktuellt tillstånd till fil"""
        state_dir = project_root / 'models' / 'oneseek-certified' / 'autonomy-state'
        state_dir.mkdir(parents=True, exist_ok=True)
        
        state_file = state_dir / f'{self.cycle_id}.json'
        with open(state_file, 'w', encoding='utf-8') as f:
            json.dump({
                'cycle_id': self.cycle_id,
                'config': self.config,
                'state': self.state,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2, ensure_ascii=False)
    
    async def run_cycle(self):
        """Kör en komplett autonom cykel"""
        
        if not self.config.get('enabled', False):
            print("⚠️  Autonomy Engine är avstängd. Aktivera i admin-panelen.")
            return {'status': 'disabled'}
        
        self.state['running'] = True
        self.state['start_time'] = datetime.now().isoformat()
        
        print(f"\n{'='*70}")
        print(f"🤖 OneSeek Autonomy Engine v3.3 - Cykel {self.cycle_id}")
        print(f"{'='*70}\n")
        
        try:
            # Steg 1: Själv-generering (03:00)
            await self.run_stage('generation', '03:00', self.stage_generation)
            
            # Steg 2: Extern policy review (03:30)
            await self.run_stage('external_review', '03:30', self.stage_external_review)
            
            # Steg 3: Intern analys (03:45)
            await self.run_stage('internal_analysis', '03:45', self.stage_internal_analysis)
            
            # Steg 4: Beslutsgate (04:00)
            await self.run_stage('decision_gate', '04:00', self.stage_decision_gate)
            
            # Kontrollera om några exempel godkändes
            if not self.state['results']['decision_gate']['approved_examples']:
                print("⛔ Inga exempel godkändes. Cykel avbruten.")
                self.state['status'] = 'no_approved_examples'
                return self.finalize_cycle()
            
            # Steg 5: Mikroträning (04:15)
            await self.run_stage('microtraining', '04:15', self.stage_microtraining)
            
            # Steg 6: Själv-verifiering (05:00)
            await self.run_stage('verification', '05:00', self.stage_verification)
            
            # Steg 7: Auto-promotion (05:30)
            await self.run_stage('promotion', '05:30', self.stage_promotion)
            
            # Steg 8: Human checkpoint (05:45)
            await self.run_stage('human_checkpoint', '05:45', self.stage_human_checkpoint)
            
            # Steg 9 & 10: Hanteras via frontend/API (röstning + aktivering)
            
            self.state['status'] = 'awaiting_human_approval'
            
        except Exception as e:
            print(f"❌ Fel under körning: {e}")
            self.state['status'] = 'failed'
            self.state['error'] = str(e)
            import traceback
            traceback.print_exc()
        
        finally:
            self.state['running'] = False
            return self.finalize_cycle()
    
    async def run_stage(self, stage_name, scheduled_time, stage_func):
        """Kör ett steg i cykeln"""
        print(f"\n📍 Steg: {stage_name} (schemalagd {scheduled_time})")
        print(f"   Startar: {datetime.now().strftime('%H:%M:%S')}")
        
        self.state['current_stage'] = stage_name
        start = time.time()
        
        try:
            result = await stage_func()
            self.state['results'][stage_name] = result
            
            duration = time.time() - start
            print(f"   ✅ Klar på {duration:.1f}s")
            
        except Exception as e:
            print(f"   ❌ Fel: {e}")
            raise
        
        self.save_state()
    
    async def stage_generation(self):
        """Steg 1: Själv-generering av träningsexempel"""
        return await generate_training_batch(
            max_examples=self.config['max_examples_per_night'],
            min_examples=self.config['min_examples_per_night'],
            language='sv'
        )
    
    async def stage_external_review(self):
        """Steg 2: Extern policy review med Gemini + GPT-4o + DeepSeek"""
        examples = self.state['results']['generation']['examples']
        return await run_external_reviews(examples)
    
    async def stage_internal_analysis(self):
        """Steg 3: Intern Stage-1 + Stage-2 analys"""
        # Använd befintlig ml_service/nlp_pipeline.py
        examples = self.state['results']['generation']['examples']
        
        # Stage-1: Dataset-analys
        from ml.pipelines.analyze_dataset import analyze_dataset_stage1
        
        # Spara tillfällig dataset
        temp_dataset = project_root / 'datasets' / f'temp-{self.cycle_id}.jsonl'
        with open(temp_dataset, 'w', encoding='utf-8') as f:
            for ex in examples:
                f.write(json.dumps(ex, ensure_ascii=False) + '\n')
        
        stage1_result = analyze_dataset_stage1(str(temp_dataset))
        
        return {
            'stage1': stage1_result,
            'stage2': None  # Körs efter träning
        }
    
    async def stage_decision_gate(self):
        """Steg 4: Beslutsgate - minst 2 av 3 externa + intern OK"""
        external_reviews = self.state['results']['external_review']
        internal_analysis = self.state['results']['internal_analysis']
        examples = self.state['results']['generation']['examples']
        
        return await apply_decision_gate(
            examples=examples,
            external_reviews=external_reviews,
            internal_analysis=internal_analysis,
            threshold=2  # 2 av 3 externa
        )
    
    async def stage_microtraining(self):
        """Steg 5: Mikroträning med 2-steg LoRA"""
        approved_examples = self.state['results']['decision_gate']['approved_examples']
        
        return await run_microtraining(
            examples=approved_examples,
            cycle_id=self.cycle_id
        )
    
    async def stage_verification(self):
        """Steg 6: Själv-verifiering med 150 frågor"""
        model_path = self.state['results']['microtraining']['model_path']
        
        return await run_self_verification(
            model_path=model_path,
            num_questions=self.config['verification_questions']
        )
    
    async def stage_promotion(self):
        """Steg 7: Auto-promotion om fidelity ≥ threshold"""
        if not self.config.get('auto_promotion_enabled', True):
            return {'promoted': False, 'reason': 'auto_promotion_disabled'}
        
        verification = self.state['results']['verification']
        fidelity = verification['fidelity_score']
        threshold = self.config['min_fidelity_threshold']
        
        if fidelity >= threshold:
            model_path = self.state['results']['microtraining']['model_path']
            return await promote_if_ready(model_path, fidelity)
        else:
            return {
                'promoted': False,
                'reason': 'fidelity_below_threshold',
                'fidelity': fidelity,
                'threshold': threshold
            }
    
    async def stage_human_checkpoint(self):
        """Steg 8: Generera Human Golden Checkpoint-frågor"""
        if not self.config.get('force_human_checkpoint', True):
            return {'generated': False, 'reason': 'checkpoint_not_required'}
        
        model_path = self.state['results']['microtraining']['model_path']
        
        return await generate_checkpoint_questions(
            model_path=model_path,
            num_questions=10,
            cycle_id=self.cycle_id
        )
    
    def finalize_cycle(self):
        """Slutför cykeln och spara till ledger"""
        self.state['end_time'] = datetime.now().isoformat()
        self.save_state()
        
        # Logga till ledger
        from ml.pipelines.log_to_ledger import log_autonomy_event
        
        try:
            log_autonomy_event(json.dumps({
                'cycle_id': self.cycle_id,
                'status': self.state.get('status', 'completed'),
                'start_time': self.state['start_time'],
                'end_time': self.state['end_time'],
                'results': self.state['results'],
                'config': self.config
            }))
        except Exception as e:
            print(f"⚠️  Kunde inte logga till ledger: {e}")
        
        print(f"\n{'='*70}")
        print(f"✅ Cykel {self.cycle_id} klar")
        print(f"   Status: {self.state.get('status', 'completed')}")
        print(f"   Tid: {self.state['start_time']} → {self.state['end_time']}")
        print(f"{'='*70}\n")
        
        return self.state


async def main():
    """Huvudfunktion för cron-körning"""
    engine = AutonomyEngineV3()
    result = await engine.run_cycle()
    
    # Skriv ut resultat för cron-loggning
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # Exit code baserat på status
    if result.get('status') in ['completed', 'awaiting_human_approval']:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())
