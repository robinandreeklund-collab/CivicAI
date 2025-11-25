import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Path to character files
const CHARACTERS_DIR = path.join(__dirname, '../../frontend/public/characters');

// In-memory cache for character data
let characterCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 60000; // 1 minute cache TTL

/**
 * Load all characters from YAML files with caching
 */
async function loadAllCharacters() {
  const now = Date.now();
  
  // Return cached data if available and fresh
  if (characterCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
    return characterCache;
  }
  
  try {
    const files = await fs.readdir(CHARACTERS_DIR);
    const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    
    const characters = await Promise.all(
      yamlFiles.map(async (file) => {
        const filePath = path.join(CHARACTERS_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        return yaml.load(content);
      })
    );
    
    // Update cache
    characterCache = characters;
    cacheTimestamp = now;
    
    return characters;
  } catch (error) {
    console.error('Error loading characters:', error);
    throw error;
  }
}

/**
 * Load a specific character by ID
 */
async function loadCharacterById(id) {
  const characters = await loadAllCharacters();
  return characters.find(c => c.id === id);
}

/**
 * GET /api/chat/characters
 * List all available character cards
 */
router.get('/characters', async (req, res) => {
  try {
    const characters = await loadAllCharacters();
    
    const characterList = characters.map(data => ({
      id: data.id,
      name: data.name,
      description: data.description,
      personality_type: data.personality_type,
      icon: data.icon
    }));

    res.json({ characters: characterList });
  } catch (error) {
    console.error('Error loading characters:', error);
    res.status(500).json({ 
      error: 'Failed to load characters',
      details: error.message 
    });
  }
});

/**
 * GET /api/chat/characters/:id
 * Get a specific character card by ID
 */
router.get('/characters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const character = await loadCharacterById(id);
    
    if (character) {
      return res.json({ character });
    }
    
    res.status(404).json({ error: 'Character not found' });
  } catch (error) {
    console.error('Error loading character:', error);
    res.status(500).json({ 
      error: 'Failed to load character',
      details: error.message 
    });
  }
});

/**
 * POST /api/chat/generate
 * Generate a response using the selected character card
 */
router.post('/generate', async (req, res) => {
  try {
    const { message, characterId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Load character card if specified
    let systemPrompt = '';
    let characterData = null;
    
    if (characterId) {
      characterData = await loadCharacterById(characterId);
      if (characterData) {
        systemPrompt = characterData.system_prompt || '';
      }
    }

    // For now, return a mock response with character context
    // In production, this would integrate with the actual LLM API
    const response = {
      message: `[${characterData?.name || 'OneSeek'}]: Tack för ditt meddelande. Detta är en mockad respons. I produktion skulle detta integreras med din LLM-tjänst.`,
      character: characterData ? {
        id: characterData.id,
        name: characterData.name,
        personality_type: characterData.personality_type
      } : null,
      systemPrompt: systemPrompt
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message 
    });
  }
});

export default router;
