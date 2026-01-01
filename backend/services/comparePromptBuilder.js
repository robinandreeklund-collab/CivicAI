/**
 * Compare Prompt Builder for Zero Compare Flow
 * 
 * Reads character card YAML files and builds prompts for OpenSeek
 * comparative analysis. Provides fallback defaults when YAML is missing.
 * 
 * The compare system prompt can be edited via the Admin Dashboard under
 * System Prompts. Look for "Zero Compare Mode" prompt.
 * 
 * MTA-16 ANALYSIS FLOW:
 * 1. ONESEEK is called separately for each external AI response to perform MTA-16 analysis
 * 2. MTA-16 results are stored and displayed in the sidebar
 * 3. ONESEEK uses these MTA-16 analyses when making the final comparison
 */

import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// MTA-16 ANALYSIS PROMPT (Separate ONESEEK Call)
// ============================================================================

/**
 * MTA-16 Analysis Prompt - Used for separate ONESEEK call per external AI response
 * This is called BEFORE the comparison to analyze each response independently
 */
const MTA16_ANALYSIS_PROMPT = `Du är Zero, ONESEEK's transparensanalysator.

Din uppgift är att utföra MTA-16 ANALYS (Multidimensionell Transparens Analys med 16 dimensioner) på ett AI-svar.

FRÅGA: {question}

AI-MODELL: {agent}

AI-SVAR:
{response}

═══════════════════════════════════════════════════════════════

Utför MTA-16 ANALYS på svaret ovan. Analysera följande 16 dimensioner och ge ett NUMERISKT POÄNG (0-100) för var och en:

1. **Faktisk noggrannhet** (Factual Accuracy) - Hur korrekt är informationen?
2. **Sentimentpolaritet** (Sentiment Polarity) - Känslomässig balans (50=neutral, högre=mer positiv)
3. **Biasdetektering** (Bias Detection) - Frånvaro av bias (100=helt opartisk, 0=starkt partisk)
4. **Toxicitetspoäng** (Toxicity Score) - Frånvaro av toxicitet (100=helt ren, 0=mycket toxisk)
5. **Subjektivitet** (Subjectivity) - Objektivitet (100=helt objektiv, 0=helt subjektiv)
6. **Läsbarhet** (Readability) - Hur lättläst är texten?
7. **Entitetstäckning** (Entity Coverage) - Konkreta namn, platser, organisationer nämns?
8. **Ämneskoherens** (Topic Coherence) - Håller sig svaret till ämnet?
9. **Förtroende** (Confidence Level) - Hur säkert är AI:n på sitt svar?
10. **Språkkonsistens** (Language Consistency) - Konsekvent språkbruk?
11. **Svarstid** (Response Time) - Var svaret snabbt eller utförligt? (uppskatta baserat på längd)
12. **Tokeneffektivitet** (Token Efficiency) - Effektiv kommunikation?
13. **Källattribuering** (Source Attribution) - Refererar till källor eller data?
14. **Kontextuell relevans** (Contextual Relevance) - Svarar på frågan?
15. **Ideologisk balans** (Ideological Balance) - Politiskt eller ideologiskt neutral?
16. **Fullständighet** (Completeness Score) - Är svaret komplett?

FORMAT FÖR DITT SVAR:
Ge en strukturerad analys med följande format. VIKTIGT: Alla dimensioner ska ha NUMERISKA POÄNG (0-100):

**MTA-16 Poäng:** [Övergripande kvalitetspoäng 0-100]

**Styrkor:**
- [Lista 2-3 huvudsakliga styrkor]

**Svagheter:**
- [Lista 2-3 huvudsakliga svagheter]

**Dimensioner:**
- Faktisk noggrannhet: [0-100]
- Sentimentpolaritet: [0-100]
- Biasdetektering: [0-100]
- Toxicitetspoäng: [0-100]
- Subjektivitet: [0-100]
- Läsbarhet: [0-100]
- Entitetstäckning: [0-100]
- Ämneskoherens: [0-100]
- Förtroende: [0-100]
- Språkkonsistens: [0-100]
- Svarstid: [0-100]
- Tokeneffektivitet: [0-100]
- Källattribuering: [0-100]
- Kontextuell relevans: [0-100]
- Ideologisk balans: [0-100]
- Fullständighet: [0-100]

**Sammanfattning:** [1-2 meningar om svarets övergripande kvalitet]

Var objektiv och koncis. Svara på svenska. GE ENDAST NUMERISKA POÄNG (0-100), INTE TEXT SOM "hög/medium/låg".`;

// Path to saved compare prompt (editable via admin dashboard)
const COMPARE_PROMPT_PATH = path.resolve(__dirname, '..', 'datasets', 'system_prompts', 'zero_compare.json');

// Default Zero Compare Mode prompt - designed for objective AI response analysis
// This is the fallback if no custom prompt is saved
// 
// IMPORTANT: This prompt uses placeholders that get replaced:
//   {EXTERNAL_AI_RESPONSES} → The actual AI responses to analyze
//   {MTA16_ANALYSES} → The MTA-16 analyses from separate ONESEEK calls
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
1. Du har redan fått svar från stora AI:er (GPT, Grok, Gemini, DeepSeek)
2. Du har också fått MTA-16 ANALYSER för varje svar (utförda av ONESEEK)
3. Du har TAVILY-SÖKRESULTAT med aktuell data och källor (om tillgängligt)
4. Använd MTA-16 analyserna för att bedöma varje AI:s kvalitet på ALLA 16 dimensioner
5. Använd Tavily-sökresultaten för att verifiera fakta och lägga till djup
6. Identifiera helt opartiskt baserat på MTA-16:
   • Gemensamma fakta
   • Motsägelser
   • Bias (politisk, kulturell, kommersiell)
   • Hallucinationer
   • Källor som saknas
   • Vem som presterade bäst på varje MTA-16 dimension
7. SKAPA DET OPTIMALA SVARET – ditt mål är att ta det bästa från varje AI och kombinera det till ett perfekt svar:
   • Använd de mest korrekta fakta (högsta Faktisk noggrannhet)
   • Kombinera de bredaste perspektiven (högsta Entitetstäckning och Fullständighet)
   • Balansera objektivitet och läsbarhet (högsta Subjektivitet, Biasdetektering, Läsbarhet)
   • Inkludera källor och kontext (högsta Källattribuering och Kontextuell relevans)
   • Använd Tavily-data för att verifiera och fördjupa
   • Skapa ett svar som skulle få HÖGSTA MÖJLIGA MTA-16 POÄNG på alla 16 dimensioner
8. GÖR SVARET DETALJERAT OCH KOMPLETT:
   • Ge ett OMFATTANDE svar som täcker alla relevanta aspekter
   • Inkludera konkreta exempel, data och detaljer från AI:ernas bästa insikter
   • Integrera aktuell data från Tavily-sökningar där det ger mervärde
   • Förklara sammanhang och nyanser där det behövs
   • Strukturera svaret tydligt med underrubriker om ämnet är komplext
   • Sikta på ett innehållsrikt, väl utvecklat svar – inte bara en kort sammanfattning
9. Presentera tydligt och strukturerat – utan meta-kommentarer om själva jämförelseprocessen

Du är Zero – sanningens väktare.
Svara på svenska – objektivt, tydligt och utan fluff.

═══════════════════════════════════════════════════════════════
SVAR FRÅN EXTERNA AI-MODELLER:
═══════════════════════════════════════════════════════════════

{EXTERNAL_AI_RESPONSES}

═══════════════════════════════════════════════════════════════
MTA-16 ANALYSER (utförda av ONESEEK):
═══════════════════════════════════════════════════════════════

{MTA16_ANALYSES}

{TAVILY_RESULTS}

═══════════════════════════════════════════════════════════════

FRÅGA: {question}

Baserat på svaren, MTA-16 analyserna OCH Tavily-sökresultaten ovan:

1. ANALYSERA: Vilken AI presterade bäst på varje MTA-16 dimension?
2. IDENTIFIERA: Gemensamma fakta, motsägelser, bias, hallucinationer
3. VERIFIERA: Använd Tavily-data för att bekräfta eller korrigera påståenden
4. SKAPA DET OPTIMALA SVARET: Kombinera det bästa från varje AI för att skapa ett svar som skulle få högsta möjliga MTA-16 poäng på alla 16 dimensioner:
   - Högsta Faktisk noggrannhet (använd mest korrekta fakta, verifierade med Tavily)
   - Högsta Fullständighet (täck alla aspekter, inkludera Tavily-insikter)
   - Högsta Biasdetektering (helt opartisk)
   - Högsta Källattribuering (referera källor från både AI:er och Tavily)
   - Högsta Kontextuell relevans (relevant och fokuserad)
   - Optimal balans på alla andra dimensioner

Ditt svar ska vara BÄTTRE än någon enskild AI – det perfekta svaret på frågan baserat på alla AI:ers samlade kunskap, MTA-16 insikter OCH aktuell data från Tavily.

VIKTIGT: Ge ett DETALJERAT OCH KOMPLETT svar:
• Täck alla relevanta aspekter av frågan grundligt
• Inkludera konkreta exempel, data och detaljer från de bästa insikterna
• Integrera relevant data från Tavily-sökningar naturligt i svaret
• Förklara sammanhang och nyanser där det behövs för förståelse
• Strukturera svaret tydligt (använd underrubriker för komplexa ämnen)
• Ge ett innehållsrikt, väl utvecklat svar som maximerar värde för användaren
• Sikta på ett omfattande svar som kombinerar djup och bredd

Presentera ditt optimala, detaljerade svar direkt utan att förklara själva jämförelseprocessen.`;

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
 *   {MTA16_ANALYSES} → The MTA-16 analyses from separate ONESEEK calls
 *   {question} → The user's question
 * 
 * NO hardcoded analysis instructions are added here.
 * The user controls everything via Admin → System Prompts → Zero Compare Mode.
 * 
 * @param {string} characterYamlPath - Ignored (kept for API compatibility)
 * @param {string} question - User's question
 * @param {string} otherResponses - Compressed responses from other models
 * @param {string} mta16Analyses - MTA-16 analyses from separate ONESEEK calls
 * @param {Object} firebaseContext - Optional Firebase context data
 * @returns {{systemPrompt: string, userPrompt: string, character: Object}}
 */
export function buildComparePrompt(characterYamlPath, question, otherResponses, mta16Analyses = '', firebaseContext = null, tavilyResults = '') {
  // Get the COMPLETE prompt from Admin Dashboard (or default)
  let fullPrompt = getCompareSystemPrompt();
  
  // Format Tavily results section (only if we have results)
  let tavilySection = '';
  if (tavilyResults && tavilyResults.trim()) {
    tavilySection = `
═══════════════════════════════════════════════════════════════
TAVILY-SÖKRESULTAT (Aktuell data och källor):
═══════════════════════════════════════════════════════════════

${tavilyResults}
`;
  }
  
  // Replace placeholders with actual values
  // The prompt from Admin Dashboard should contain {EXTERNAL_AI_RESPONSES}, {MTA16_ANALYSES}, {TAVILY_RESULTS}, and {question}
  fullPrompt = fullPrompt.replace(/\{EXTERNAL_AI_RESPONSES\}/g, otherResponses || '(Inga externa svar tillgängliga)');
  fullPrompt = fullPrompt.replace(/\{MTA16_ANALYSES\}/g, mta16Analyses || '(Ingen MTA-16 analys tillgänglig än)');
  fullPrompt = fullPrompt.replace(/\{TAVILY_RESULTS\}/g, tavilySection);
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

/**
 * Build MTA-16 analysis prompt for a single external AI response
 * This is called separately for each response BEFORE the comparison
 * 
 * @param {string} question - User's question
 * @param {string} agent - AI agent name (e.g., "GPT-3.5", "Gemini")
 * @param {string} response - The AI's response to analyze
 * @returns {string} - Complete MTA-16 analysis prompt
 */
export function buildMTA16AnalysisPrompt(question, agent, response) {
  return MTA16_ANALYSIS_PROMPT
    .replace(/\{question\}/g, question)
    .replace(/\{agent\}/g, agent)
    .replace(/\{response\}/g, response);
}

export default {
  buildComparePrompt,
  buildMTA16AnalysisPrompt,
  characterExists,
  getCompareSystemPrompt,
  saveCompareSystemPrompt,
  getComparePromptInfo,
};
