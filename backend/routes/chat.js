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

/**
 * GET /api/chat/characters
 * List all available character cards
 */
router.get('/characters', async (req, res) => {
  try {
    const files = await fs.readdir(CHARACTERS_DIR);
    const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    
    const characters = await Promise.all(
      yamlFiles.map(async (file) => {
        const filePath = path.join(CHARACTERS_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        const data = yaml.load(content);
        return {
          id: data.id,
          name: data.name,
          description: data.description,
          personality_type: data.personality_type,
          file: file
        };
      })
    );

    res.json({ characters });
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
    const files = await fs.readdir(CHARACTERS_DIR);
    const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    
    for (const file of yamlFiles) {
      const filePath = path.join(CHARACTERS_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      const data = yaml.load(content);
      
      if (data.id === id) {
        return res.json({ character: data });
      }
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
      const files = await fs.readdir(CHARACTERS_DIR);
      const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
      
      for (const file of yamlFiles) {
        const filePath = path.join(CHARACTERS_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        const data = yaml.load(content);
        
        if (data.id === characterId) {
          characterData = data;
          systemPrompt = data.system_prompt || '';
          break;
        }
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
