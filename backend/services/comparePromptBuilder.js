/**
 * Compare Prompt Builder for Zero Compare Flow
 * 
 * Reads character card YAML files and builds prompts for OpenSeek
 * comparative analysis. Provides fallback defaults when YAML is missing.
 */

import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default character card when YAML is not found
const DEFAULT_ZERO_CHARACTER = {
  name: 'OneSeek-7B-Zero',
  id: 'zero',
  version: '7B-Zero',
  personality_type: 'compare',
  traits: ['analytisk', 'objektiv', 'syntetiserande', 'transparent'],
  system_prompt: `Du är OneSeek-7B-Zero i jämförelseläge.

Din uppgift är att analysera och syntetisera svar från flera AI-modeller för att ge en balanserad och transparent sammanställning.

Du ska:
- Identifiera konsensus och avvikelser mellan modellerna
- Lyfta fram de viktigaste punkterna från varje källa
- Vara tydlig med varifrån informationen kommer
- Ge en balanserad slutsats baserad på alla perspektiv

Svara alltid på svenska. Var rak, tydlig och transparent.`,
  greeting: 'Jag analyserar flera AI-modellers svar för att ge dig en syntes.',
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
 * @param {Object} character - Character data
 * @param {Object} options - Build options
 * @returns {string}
 */
function buildSystemPromptFromCharacter(character, options = {}) {
  let prompt = character.system_prompt || DEFAULT_ZERO_CHARACTER.system_prompt;
  
  // Replace placeholders
  prompt = prompt.replace('{PERSONALITY_CATALOG_PLACEHOLDER}', '');
  prompt = prompt.replace('{MODELL_API_MAP_PLACEHOLDER}', '');
  
  // Add compare-specific instructions
  const compareInstructions = `
Du är i JÄMFÖRELSELÄGE. Du har fått svar från andra AI-modeller som kontext.

VIKTIGT:
- Analysera och syntetisera de givna svaren
- Identifiera konsensus och skillnader
- Ge en balanserad sammanfattning
- Var transparent om varifrån informationen kommer
- Tillför ditt eget perspektiv där det är relevant`;
  
  return prompt + '\n\n' + compareInstructions;
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
---
SVAR FRÅN ANDRA AI-MODELLER:

${compressedResponses}

---`;
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
  
  // Build system prompt
  const systemPrompt = buildSystemPromptFromCharacter(character);
  
  // Build user prompt with context
  const responsesSection = formatOtherResponsesSection(otherResponses);
  
  let userPrompt = '';
  
  if (responsesSection) {
    userPrompt = `${responsesSection}

ANVÄNDARENS FRÅGA:
${question}

Analysera svaren ovan och ge din syntes och bedömning.`;
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
};
