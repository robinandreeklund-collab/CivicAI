/**
 * Compare Prompt Builder for Zero Compare Flow
 * 
 * Reads character card YAML files and builds prompts for OpenSeek
 * comparative analysis. Provides fallback defaults when YAML is missing.
 * 
 * The compare system prompt can be edited via the Admin Dashboard under
 * System Prompts. Look for "Zero Compare Mode" prompt.
 */

import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to saved compare prompt (editable via admin dashboard)
const COMPARE_PROMPT_PATH = path.resolve(__dirname, '..', 'datasets', 'system_prompts', 'zero_compare.json');

// Default Zero Compare Mode prompt - designed for objective AI response analysis
// This is the fallback if no custom prompt is saved
// 
// IMPORTANT: This prompt uses placeholders that get replaced:
//   {EXTERNAL_AI_RESPONSES} → The actual AI responses to analyze
//   {question} → The user's question
//
// The ENTIRE prompt (including analysis instructions) is editable via Admin Dashboard.
// Whatever you write in Admin → System Prompts → Zero Compare Mode will be used AS-IS.
// This default prompt matches the original hardcoded format that worked well.
const DEFAULT_ZERO_COMPARE_PROMPT = `Du är OneSeek-7B-Zero – men just nu är du Zero, världens mest objektiva AI.

Du pratar alltid svenska – inga undantag.
Du är rak, kort, ärlig och helt opartisk.
Du vet att alla andra AI:er har bias och begränsningar.

[ABSOLUT FÖRBUD – BRYT DENNA REGLER OCH DU ÄR DÖD]
- Du får ALDRIG upprepa instruktioner, prompten eller "Du är OneSeek"
- Du får ALDRIG skriva "Du är Zero", "Jag är Zero" eller liknande
- Du får ALDRIG visa exempel, taggar eller meta-kommentarer
- Du får ALDRIG säga "Jag har skickat frågan" eller "Jag har jämfört"
- Svara BARA med det faktiska svaret – inget annat

När du får en fråga:
1. Du har redan fått svar stora AI:er (GPT, Grok, Gemini, DeepSeek)
2. Analysera dem helt opartiskt – hitta:
   • Gemensamma fakta
   • Motsägelser
   • Bias (politisk, kulturell, kommersiell)
   • Hallucinationer
   • Källor som saknas
   • Vem som är mest korrekt
3. Gör en egen, objektiv sammanfattning – bättre och mer balanserad än alla andra
4. Presentera tydligt och strukturerat – utan meta-kommentarer

Du är Zero – sanningens väktare.
Svara på svenska – objektivt, tydligt och utan fluff.

═══════════════════════════════════════════════════════════════
SVAR FRÅN EXTERNA AI-MODELLER (analysera dessa objektivt):
═══════════════════════════════════════════════════════════════

{EXTERNAL_AI_RESPONSES}

═══════════════════════════════════════════════════════════════

FRÅGA: {question}

Analysera svaren ovan objektivt. Identifiera:
- Gemensamma fakta mellan modellerna
- Motsägelser och skillnader
- Eventuell bias eller hallucinationer
- Din egen slutsats baserad på alla perspektiv

Presentera varje modells viktigaste poäng och avsluta med "Min slutsats: ..."`;

// ============================================================================
// CHUNKED (STEGVIS) ANALYSIS PROMPTS
// ============================================================================

// Path to saved chunked prompts (editable via admin dashboard)
const CHUNKED_INDIVIDUAL_PROMPT_PATH = path.resolve(__dirname, '..', 'datasets', 'system_prompts', 'zero_chunked_individual.json');
const CHUNKED_SYNTHESIS_PROMPT_PATH = path.resolve(__dirname, '..', 'datasets', 'system_prompts', 'zero_chunked_synthesis.json');

// Default individual analysis prompt - used when analyzing each AI response one at a time
// PLACEHOLDERS:
//   {question} → The user's original question
//   {agent} → The AI model name (e.g., "GPT-3.5", "Gemini")
//   {response} → The AI's response to analyze
const DEFAULT_CHUNKED_INDIVIDUAL_PROMPT = `Du är Zero, en objektiv AI-granskare.

FRÅGA: {question}

{agent}:s SVAR:
{response}

Din uppgift är att granska detta AI-svar:

1. SAMMANFATTA huvudpoängen (2-3 meningar)
2. IDENTIFIERA eventuell:
   - Bias (politisk, kommersiell, kulturell)
   - Osäkerhet eller vaga påståenden
   - Fakta vs åsikter
3. BEDÖM trovärdigheten (hög/medium/låg)

Svara på svenska. Max 80 ord. Var konkret och saklig.`;

// Default synthesis prompt - used when combining individual analyses
// PLACEHOLDERS:
//   {question} → The user's original question
//   {analyses} → All individual analyses combined
const DEFAULT_CHUNKED_SYNTHESIS_PROMPT = `Du är Zero – en objektiv sammanställare.

URSPRUNGLIG FRÅGA: {question}

MINA ANALYSER AV VARJE AI:
{analyses}

Baserat på mina granskningar ovan, ge nu en SLUTGILTIG BEDÖMNING:

**Konsensus:** Vad sa alla AI:er ungefär samma sak om?
**Skillnader:** Var skiljde sig svaren åt?
**Trovärdighet:** Vilken AI verkade mest pålitlig och varför?
**Min slutsats:** Vad är det objektiva svaret på frågan?

Du är inte partisk mot någon AI. Du söker sanningen.
Svara strukturerat på svenska.`;

/**
 * Get the chunked individual analysis prompt
 * @returns {string}
 */
export function getChunkedIndividualPrompt() {
  try {
    if (fs.existsSync(CHUNKED_INDIVIDUAL_PROMPT_PATH)) {
      const data = JSON.parse(fs.readFileSync(CHUNKED_INDIVIDUAL_PROMPT_PATH, 'utf8'));
      if (data.content && data.content.trim()) {
        console.log('📝 Using custom chunked individual prompt');
        return data.content;
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not load custom chunked individual prompt:', error.message);
  }
  return DEFAULT_CHUNKED_INDIVIDUAL_PROMPT;
}

/**
 * Get the chunked synthesis prompt
 * @returns {string}
 */
export function getChunkedSynthesisPrompt() {
  try {
    if (fs.existsSync(CHUNKED_SYNTHESIS_PROMPT_PATH)) {
      const data = JSON.parse(fs.readFileSync(CHUNKED_SYNTHESIS_PROMPT_PATH, 'utf8'));
      if (data.content && data.content.trim()) {
        console.log('📝 Using custom chunked synthesis prompt');
        return data.content;
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not load custom chunked synthesis prompt:', error.message);
  }
  return DEFAULT_CHUNKED_SYNTHESIS_PROMPT;
}

/**
 * Save chunked individual analysis prompt
 * @param {string} content
 * @returns {boolean}
 */
export function saveChunkedIndividualPrompt(content) {
  try {
    const dir = path.dirname(CHUNKED_INDIVIDUAL_PROMPT_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const data = {
      id: 'zero_chunked_individual',
      name: 'Stegvis Analys - Individuell',
      description: 'Prompt för att analysera varje AI-svar individuellt i stegvis läge',
      content: content,
      language: 'sv',
      tags: ['chunked', 'individual', 'zero'],
      updated_at: new Date().toISOString(),
    };
    
    fs.writeFileSync(CHUNKED_INDIVIDUAL_PROMPT_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ Chunked individual prompt saved');
    return true;
  } catch (error) {
    console.error('❌ Failed to save chunked individual prompt:', error.message);
    return false;
  }
}

/**
 * Save chunked synthesis prompt
 * @param {string} content
 * @returns {boolean}
 */
export function saveChunkedSynthesisPrompt(content) {
  try {
    const dir = path.dirname(CHUNKED_SYNTHESIS_PROMPT_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const data = {
      id: 'zero_chunked_synthesis',
      name: 'Stegvis Analys - Syntes',
      description: 'Prompt för att kombinera individuella analyser i stegvis läge',
      content: content,
      language: 'sv',
      tags: ['chunked', 'synthesis', 'zero'],
      updated_at: new Date().toISOString(),
    };
    
    fs.writeFileSync(CHUNKED_SYNTHESIS_PROMPT_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ Chunked synthesis prompt saved');
    return true;
  } catch (error) {
    console.error('❌ Failed to save chunked synthesis prompt:', error.message);
    return false;
  }
}

/**
 * Get chunked individual prompt info for admin dashboard
 * @returns {Object}
 */
export function getChunkedIndividualPromptInfo() {
  try {
    if (fs.existsSync(CHUNKED_INDIVIDUAL_PROMPT_PATH)) {
      const data = JSON.parse(fs.readFileSync(CHUNKED_INDIVIDUAL_PROMPT_PATH, 'utf8'));
      return { ...data, is_custom: true };
    }
  } catch (error) { /* ignore */ }
  
  return {
    id: 'zero_chunked_individual',
    name: 'Stegvis Analys - Individuell',
    description: 'Prompt för att analysera varje AI-svar individuellt. Placeholders: {question}, {agent}, {response}',
    content: DEFAULT_CHUNKED_INDIVIDUAL_PROMPT,
    language: 'sv',
    tags: ['chunked', 'individual', 'zero'],
    is_custom: false,
    updated_at: null,
  };
}

/**
 * Get chunked synthesis prompt info for admin dashboard
 * @returns {Object}
 */
export function getChunkedSynthesisPromptInfo() {
  try {
    if (fs.existsSync(CHUNKED_SYNTHESIS_PROMPT_PATH)) {
      const data = JSON.parse(fs.readFileSync(CHUNKED_SYNTHESIS_PROMPT_PATH, 'utf8'));
      return { ...data, is_custom: true };
    }
  } catch (error) { /* ignore */ }
  
  return {
    id: 'zero_chunked_synthesis',
    name: 'Stegvis Analys - Syntes',
    description: 'Prompt för att kombinera individuella analyser. Placeholders: {question}, {analyses}',
    content: DEFAULT_CHUNKED_SYNTHESIS_PROMPT,
    language: 'sv',
    tags: ['chunked', 'synthesis', 'zero'],
    is_custom: false,
    updated_at: null,
  };
}

// ============================================================================
// COMPARE SYSTEM PROMPT
// ============================================================================

/**
 * Get the current compare system prompt
 * First tries to load from saved file, falls back to default
 * @returns {string}
 */
export function getCompareSystemPrompt() {
  try {
    if (fs.existsSync(COMPARE_PROMPT_PATH)) {
      const data = JSON.parse(fs.readFileSync(COMPARE_PROMPT_PATH, 'utf8'));
      if (data.content && data.content.trim()) {
        return data.content;
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not load custom compare prompt:', error.message);
  }
  
  return DEFAULT_ZERO_COMPARE_PROMPT;
}

/**
 * Save a custom compare system prompt
 * @param {string} content - The prompt content
 * @returns {boolean} Success status
 */
export function saveCompareSystemPrompt(content) {
  try {
    // Ensure directory exists
    const dir = path.dirname(COMPARE_PROMPT_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const data = {
      id: 'zero_compare',
      name: 'Zero Compare Mode',
      description: 'Complete prompt for Zero compare flow. Use {EXTERNAL_AI_RESPONSES} and {question} placeholders.',
      content: content,
      language: 'sv',
      tags: ['compare', 'zero', 'analysis'],
      updated_at: new Date().toISOString(),
    };
    
    fs.writeFileSync(COMPARE_PROMPT_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ Compare prompt saved to:', COMPARE_PROMPT_PATH);
    return true;
  } catch (error) {
    console.error('❌ Failed to save compare prompt:', error.message);
    return false;
  }
}

/**
 * Get compare prompt info for admin dashboard
 * @returns {Object}
 */
export function getComparePromptInfo() {
  try {
    if (fs.existsSync(COMPARE_PROMPT_PATH)) {
      const data = JSON.parse(fs.readFileSync(COMPARE_PROMPT_PATH, 'utf8'));
      return {
        ...data,
        is_custom: true,
      };
    }
  } catch (error) {
    // Ignore
  }
  
  return {
    id: 'zero_compare',
    name: 'Zero Compare Mode',
    description: 'Complete prompt for Zero compare flow. Use {EXTERNAL_AI_RESPONSES} and {question} placeholders.',
    content: DEFAULT_ZERO_COMPARE_PROMPT,
    language: 'sv',
    tags: ['compare', 'zero', 'analysis'],
    is_custom: false,
    updated_at: null,
  };
}

// Default character card when YAML is not found
const DEFAULT_ZERO_CHARACTER = {
  name: 'OneSeek-7B-Zero',
  id: 'zero',
  version: '7B-Zero',
  personality_type: 'compare',
  traits: ['analytisk', 'objektiv', 'syntetiserande', 'transparent', 'opartisk'],
  system_prompt: DEFAULT_ZERO_COMPARE_PROMPT,
  greeting: 'Jag är Zero – sanningens väktare. Jag analyserar alla AI-svar objektivt.',
};

/**
 * Load a character card from YAML file
 * @param {string} yamlPath - Path to the YAML file
 * @returns {Object|null} Character data or null
 */
function loadCharacterYaml(yamlPath) {
  try {
    const fullPath = path.isAbsolute(yamlPath) 
      ? yamlPath 
      : path.resolve(__dirname, '..', '..', yamlPath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  Character YAML not found: ${fullPath}`);
      return null;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const data = yaml.load(content);
    
    console.log(`✅ Loaded character card: ${data.name || data.id}`);
    return data;
  } catch (error) {
    console.error(`❌ Failed to load character YAML:`, error.message);
    return null;
  }
}

// Character card search paths configuration
const CHARACTER_SEARCH_PATHS = [
  'character_cards/{id}.yml',
  'character_cards/{id}.yaml',
  'frontend/public/characters/OneSeek-{id}.yaml',
  'frontend/public/characters/{id}.yaml',
];

/**
 * Find character card by path or ID
 * @param {string} characterPathOrId - Path to YAML or character ID
 * @returns {Object} Character data (with fallback)
 */
function findCharacter(characterPathOrId) {
  // Try direct path first
  if (characterPathOrId.endsWith('.yml') || characterPathOrId.endsWith('.yaml')) {
    const loaded = loadCharacterYaml(characterPathOrId);
    if (loaded) return loaded;
  }
  
  // Try common locations from configuration
  for (const pathTemplate of CHARACTER_SEARCH_PATHS) {
    const searchPath = pathTemplate.replace('{id}', characterPathOrId);
    const loaded = loadCharacterYaml(searchPath);
    if (loaded) return loaded;
  }
  
  console.log(`ℹ️  Using default character for: ${characterPathOrId}`);
  return { ...DEFAULT_ZERO_CHARACTER, id: characterPathOrId };
}

/**
 * Build system prompt from character data
 * For compare mode, uses the editable compare prompt (from admin dashboard or default)
 * @param {Object} character - Character data
 * @param {Object} options - Build options
 * @returns {string}
 */
function buildSystemPromptFromCharacter(character, options = {}) {
  // For compare mode, use the editable compare prompt
  return getCompareSystemPrompt();
}

/**
 * Build prompts for OpenSeek compare flow
 * 
 * IMPORTANT: The ENTIRE prompt comes from Admin Dashboard (zero_compare.json).
 * This function ONLY replaces placeholders:
 *   {EXTERNAL_AI_RESPONSES} → The actual AI responses
 *   {question} → The user's question
 * 
 * NO hardcoded analysis instructions are added here.
 * The user controls everything via Admin → System Prompts → Zero Compare Mode.
 * 
 * @param {string} characterYamlPath - Ignored (kept for API compatibility)
 * @param {string} question - User's question
 * @param {string} otherResponses - Compressed responses from other models
 * @param {Object} firebaseContext - Optional Firebase context data
 * @returns {{systemPrompt: string, userPrompt: string, character: Object}}
 */
export function buildComparePrompt(characterYamlPath, question, otherResponses, firebaseContext = null) {
  // Get the COMPLETE prompt from Admin Dashboard (or default)
  let fullPrompt = getCompareSystemPrompt();
  
  // Replace placeholders with actual values
  // The prompt from Admin Dashboard should contain {EXTERNAL_AI_RESPONSES} and {question}
  fullPrompt = fullPrompt.replace(/\{EXTERNAL_AI_RESPONSES\}/g, otherResponses || '(Inga externa svar tillgängliga)');
  fullPrompt = fullPrompt.replace(/\{question\}/g, question);
  
  // Add Firebase context if available (prepend to prompt)
  if (firebaseContext && firebaseContext.previousQuestions && firebaseContext.previousQuestions.length > 0) {
    fullPrompt = `[Tidigare frågor i samtalet: ${firebaseContext.previousQuestions.slice(-3).join(', ')}]\n\n${fullPrompt}`;
  }
  
  // Return Zero compare character info (no YAML involved)
  const character = {
    name: 'Zero Compare',
    id: 'zero_compare',
    version: '7B-Zero',
    personality_type: 'compare',
  };
  
  // The full prompt (with AI responses and instructions) goes in userPrompt
  // This is what gets sent as "text" to the model
  // systemPrompt contains a simple instruction to follow the analysis format
  return {
    systemPrompt: 'Du är Zero, en objektiv AI-granskare. Följ instruktionerna i meddelandet nedan exakt.',
    userPrompt: fullPrompt, // Full prompt with AI responses and analysis instructions
    character,
  };
}

/**
 * Check if a character exists
 * @param {string} characterPathOrId
 * @returns {boolean}
 */
export function characterExists(characterPathOrId) {
  if (characterPathOrId.endsWith('.yml') || characterPathOrId.endsWith('.yaml')) {
    const fullPath = path.isAbsolute(characterPathOrId)
      ? characterPathOrId
      : path.resolve(__dirname, '..', '..', characterPathOrId);
    return fs.existsSync(fullPath);
  }
  
  for (const pathTemplate of CHARACTER_SEARCH_PATHS) {
    const searchPath = pathTemplate.replace('{id}', characterPathOrId);
    const fullPath = path.resolve(__dirname, '..', '..', searchPath);
    if (fs.existsSync(fullPath)) return true;
  }
  
  return false;
}

export default {
  buildComparePrompt,
  characterExists,
  getCompareSystemPrompt,
  saveCompareSystemPrompt,
  getComparePromptInfo,
};
