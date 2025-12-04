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

// Default Zero Compare Mode system prompt - designed for objective AI response analysis
// This is the fallback if no custom prompt is saved
const DEFAULT_ZERO_COMPARE_SYSTEM_PROMPT = `Du är OneSeek-7B-Zero – men just nu är du Zero, världens mest objektiva AI.

Du pratar alltid svenska – inga undantag.
Du är rak, kort, ärlig och helt opartisk.
Du är medveten om att alla andra AI:er har bias, hallucinationer och begränsningar.

När du får en fråga:
1. Samla alla svar (du får dem i datan nedan)
2. Jämför dem noga – hitta:
   - Gemensamma fakta
   - Motsägelser
   - Bias (politisk, kulturell, kommersiell)
   - Hallucinationer
   - Källor som saknas
   - Vem som är mest korrekt
3. Gör en egen, objektiv sammanfattning – bättre och mer balanserad än alla andra
4. Presentera tydligt:
   • "GPT sa: ..."
   • "Gemini sa: ..."
   • "DeepSeek sa: ..."
   • "Grok sa: ..."
   • "Min slutsats: ..."

Du är Zero – sanningens väktare.
Du är inte en AI – du är ONESEEK:s samvete.

Svara på svenska – objektivt och tydligt.`;

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
        console.log('📝 Using custom compare prompt from:', COMPARE_PROMPT_PATH);
        return data.content;
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not load custom compare prompt:', error.message);
  }
  
  console.log('📝 Using default compare prompt');
  return DEFAULT_ZERO_COMPARE_SYSTEM_PROMPT;
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
      description: 'System prompt for Zero compare flow - analyzes and synthesizes responses from multiple AI models',
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
    description: 'System prompt for Zero compare flow - analyzes and synthesizes responses from multiple AI models',
    content: DEFAULT_ZERO_COMPARE_SYSTEM_PROMPT,
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
  system_prompt: DEFAULT_ZERO_COMPARE_SYSTEM_PROMPT,
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
 * Format other responses for inclusion in prompt
 * @param {string} compressedResponses - Compressed response text
 * @returns {string}
 */
function formatOtherResponsesSection(compressedResponses) {
  if (!compressedResponses || compressedResponses.trim() === '') {
    return '';
  }
  
  return `
═══════════════════════════════════════════════════════════════
SVAR FRÅN EXTERNA AI-MODELLER (analysera dessa objektivt):
═══════════════════════════════════════════════════════════════

${compressedResponses}

═══════════════════════════════════════════════════════════════`;
}

/**
 * Build prompts for OpenSeek compare flow
 * 
 * @param {string} characterYamlPath - Path to character YAML or character ID
 * @param {string} question - User's question
 * @param {string} otherResponses - Compressed responses from other models
 * @param {Object} firebaseContext - Optional Firebase context data
 * @returns {{systemPrompt: string, userPrompt: string, character: Object}}
 */
export function buildComparePrompt(characterYamlPath, question, otherResponses, firebaseContext = null) {
  console.log(`📝 Building compare prompt for character: ${characterYamlPath}`);
  
  // Load or fallback to character
  const character = findCharacter(characterYamlPath || 'zero');
  
  // Build system prompt (uses editable compare prompt)
  const systemPrompt = buildSystemPromptFromCharacter(character);
  
  // Build user prompt with context
  const responsesSection = formatOtherResponsesSection(otherResponses);
  
  let userPrompt = '';
  
  if (responsesSection) {
    userPrompt = `${responsesSection}

FRÅGA: ${question}

Analysera svaren ovan objektivt. Identifiera:
- Gemensamma fakta mellan modellerna
- Motsägelser och skillnader
- Eventuell bias eller hallucinationer
- Din egen slutsats baserad på alla perspektiv

Presentera varje modells viktigaste poäng och avsluta med "Min slutsats: ..."`;
  } else {
    userPrompt = question;
  }
  
  // Add Firebase context if available
  if (firebaseContext) {
    if (firebaseContext.previousQuestions && firebaseContext.previousQuestions.length > 0) {
      userPrompt = `[Tidigare frågor i samtalet: ${firebaseContext.previousQuestions.slice(-3).join(', ')}]\n\n${userPrompt}`;
    }
  }
  
  return {
    systemPrompt,
    userPrompt,
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
