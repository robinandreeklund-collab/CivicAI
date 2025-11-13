/**
 * Policy Question Schema
 * Defines the structure for policy question bank items
 */

export const PolicyCategory = {
  DEMOCRACY: 'democracy',
  ENVIRONMENT: 'environment',
  ECONOMY: 'economy',
  EDUCATION: 'education',
  HEALTHCARE: 'healthcare',
  SECURITY: 'security',
  TECHNOLOGY: 'technology',
  SOCIAL: 'social',
  OTHER: 'other',
};

/**
 * Creates a policy question object
 * @param {string} question - The question text
 * @param {string} category - Question category from PolicyCategory
 * @param {string} description - Optional description
 * @param {array} tags - Optional tags for filtering
 * @returns {object} Policy question object
 */
export function createPolicyQuestion(question, category = PolicyCategory.OTHER, description = '', tags = []) {
  return {
    id: `pq-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    question,
    category,
    description,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  };
}

export const PolicyQuestionSchema = {
  type: 'object',
  required: ['id', 'question', 'category', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'string' },
    question: { type: 'string', minLength: 5, maxLength: 500 },
    category: { type: 'string', enum: Object.values(PolicyCategory) },
    description: { type: 'string', maxLength: 1000 },
    tags: { type: 'array', items: { type: 'string' } },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    usageCount: { type: 'number', minimum: 0 },
  },
};
