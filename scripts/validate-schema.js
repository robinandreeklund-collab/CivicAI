/**
 * Schema Validation Helper
 * Validates data against Firestore collection schemas
 * 
 * Usage:
 *   const { validateSchema } = require('./scripts/validate-schema');
 *   
 *   const interaction = { ... };
 *   if (!validateSchema('ai_interactions', interaction)) {
 *     throw new Error('Invalid schema');
 *   }
 */

// Schema definitions based on docs/schemas/README.md
const schemas = {
  ai_interactions: {
    required: ['interactionId', 'timestamp', 'question', 'responses'],
    properties: {
      interactionId: { type: 'string', pattern: /^[a-f0-9\-]{36}$/ },
      userId: { type: 'string', optional: true },
      timestamp: { type: 'date' },
      question: {
        type: 'object',
        required: ['text', 'hash'],
        properties: {
          text: { type: 'string', maxLength: 10000 },
          hash: { type: 'string', pattern: /^[a-f0-9]{64}$/ },
          language: { type: 'string', optional: true }
        }
      },
      responses: {
        type: 'array',
        minItems: 1,
        maxItems: 10,
        items: {
          type: 'object',
          required: ['agent', 'response'],
          properties: {
            agent: { type: 'string', enum: ['gpt-3.5', 'gemini', 'deepseek'] },
            response: { type: 'string' },
            responseTime: { type: 'number', optional: true },
            model: { type: 'object', optional: true },
            analysis: { type: 'object', optional: true },
            pipelineAnalysis: { type: 'object', optional: true }
          }
        }
      },
      modelSynthesis: { type: 'object', optional: true },
      debate: { type: 'object', optional: true },
      metadata: { type: 'object', optional: true }
    }
  },

  model_versions: {
    required: ['modelId', 'provider', 'modelName', 'version'],
    properties: {
      modelId: { type: 'string' },
      provider: { type: 'string', enum: ['openai', 'google', 'deepseek'] },
      modelName: { type: 'string' },
      version: { type: 'string' },
      configuration: { type: 'object', optional: true },
      capabilities: { type: 'object', optional: true },
      profile: { type: 'object', optional: true },
      usage: { type: 'object', optional: true },
      metadata: { type: 'object', optional: true }
    }
  },

  ledger_blocks: {
    required: ['blockId', 'blockNumber', 'timestamp', 'previousHash', 'currentHash', 'data'],
    properties: {
      blockId: { type: 'string', pattern: /^[a-f0-9\-]{36}$/ },
      blockNumber: { type: 'number', min: 0 },
      timestamp: { type: 'date' },
      previousHash: { type: 'string', pattern: /^[a-f0-9]{64}$/ },
      currentHash: { type: 'string', pattern: /^[a-f0-9]{64}$/ },
      nonce: { type: 'number', optional: true },
      data: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ['interaction', 'model_update', 'system_event'] }
        }
      },
      metadata: { type: 'object', optional: true }
    }
  },

  change_events: {
    required: ['eventId', 'timestamp', 'changeType', 'modelId'],
    properties: {
      eventId: { type: 'string', pattern: /^[a-f0-9\-]{36}$/ },
      timestamp: { type: 'date' },
      changeType: { type: 'string', enum: ['response_drift', 'model_update', 'bias_shift', 'performance_change'] },
      modelId: { type: 'string' },
      interactionId: { type: 'string', optional: true },
      changeDetails: { type: 'object', optional: true },
      detection: { type: 'object', optional: true },
      impact: { type: 'object', optional: true },
      metadata: { type: 'object', optional: true }
    }
  }
};

function validateType(value, typeDef) {
  if (typeDef.optional && (value === undefined || value === null)) {
    return true;
  }

  if (value === undefined || value === null) {
    return false;
  }

  // Check type
  if (typeDef.type === 'string' && typeof value !== 'string') return false;
  if (typeDef.type === 'number' && typeof value !== 'number') return false;
  if (typeDef.type === 'boolean' && typeof value !== 'boolean') return false;
  if (typeDef.type === 'object' && typeof value !== 'object') return false;
  if (typeDef.type === 'array' && !Array.isArray(value)) return false;
  if (typeDef.type === 'date' && !(value instanceof Date) && typeof value !== 'object') return false;

  // Check pattern
  if (typeDef.pattern && !typeDef.pattern.test(value)) return false;

  // Check enum
  if (typeDef.enum && !typeDef.enum.includes(value)) return false;

  // Check length constraints
  if (typeDef.maxLength && value.length > typeDef.maxLength) return false;
  if (typeDef.minLength && value.length < typeDef.minLength) return false;

  // Check numeric constraints
  if (typeDef.min !== undefined && value < typeDef.min) return false;
  if (typeDef.max !== undefined && value > typeDef.max) return false;

  // Check array constraints
  if (typeDef.type === 'array') {
    if (typeDef.minItems && value.length < typeDef.minItems) return false;
    if (typeDef.maxItems && value.length > typeDef.maxItems) return false;
    
    if (typeDef.items) {
      for (const item of value) {
        if (!validateType(item, typeDef.items)) return false;
      }
    }
  }

  // Check nested object properties
  if (typeDef.type === 'object' && typeDef.properties) {
    for (const [key, propDef] of Object.entries(typeDef.properties)) {
      if (!validateType(value[key], propDef)) return false;
    }
    
    if (typeDef.required) {
      for (const requiredKey of typeDef.required) {
        if (!(requiredKey in value)) return false;
      }
    }
  }

  return true;
}

function validateSchema(collectionName, data) {
  const schema = schemas[collectionName];
  
  if (!schema) {
    console.warn(`[Schema Validator] No schema defined for collection: ${collectionName}`);
    return true; // Allow if no schema defined
  }

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data)) {
        console.error(`[Schema Validator] Missing required field: ${field}`);
        return false;
      }
    }
  }

  // Validate each property
  if (schema.properties) {
    for (const [key, typeDef] of Object.entries(schema.properties)) {
      if (!validateType(data[key], typeDef)) {
        console.error(`[Schema Validator] Invalid value for field: ${key}`);
        return false;
      }
    }
  }

  return true;
}

module.exports = {
  validateSchema,
  schemas
};
