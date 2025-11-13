/**
 * Policy Question Bank Service
 * Manages policy-related questions
 * 
 * NOTE: In-memory storage for MVP. Replace with database for production.
 */

import { createPolicyQuestion, PolicyCategory } from '../schemas/policyQuestion.js';

// In-memory storage with some initial questions (replace with database in production)
const policyQuestions = [
  createPolicyQuestion(
    'Hur kan vi säkerställa transparent beslutsfattande i kommunala projekt?',
    PolicyCategory.DEMOCRACY,
    'Fråga om demokratisk insyn i lokalpolitik',
    ['transparens', 'demokrati', 'kommun']
  ),
  createPolicyQuestion(
    'Vilka åtgärder kan vidtas för att minska koldioxidutsläpp i staden?',
    PolicyCategory.ENVIRONMENT,
    'Fråga om miljömässig hållbarhet på lokal nivå',
    ['miljö', 'klimat', 'hållbarhet']
  ),
  createPolicyQuestion(
    'Hur bör AI-verktyg regleras i offentlig sektor?',
    PolicyCategory.TECHNOLOGY,
    'Fråga om AI-etik och reglering',
    ['AI', 'reglering', 'etik', 'teknologi']
  ),
];

/**
 * Get all policy questions with optional filtering
 * @param {object} filters - Optional filters (category, tags, search)
 * @param {number} limit - Maximum number of questions to return
 * @param {number} offset - Offset for pagination
 * @returns {object} Filtered questions with pagination info
 */
export function getPolicyQuestions(filters = {}, limit = 50, offset = 0) {
  let filtered = [...policyQuestions];
  
  // Filter by category
  if (filters.category) {
    filtered = filtered.filter(q => q.category === filters.category);
  }
  
  // Filter by tags
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(q => 
      filters.tags.some(tag => q.tags.includes(tag))
    );
  }
  
  // Search in question text and description
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(q => 
      q.question.toLowerCase().includes(searchLower) ||
      q.description.toLowerCase().includes(searchLower)
    );
  }
  
  // Sort by usage count (most used first), then by creation date
  filtered.sort((a, b) => {
    if (b.usageCount !== a.usageCount) {
      return b.usageCount - a.usageCount;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  // Apply pagination
  const paginated = filtered.slice(offset, offset + limit);
  
  return {
    questions: paginated,
    total: filtered.length,
    limit,
    offset,
  };
}

/**
 * Get a policy question by ID
 * @param {string} id - Question ID
 * @returns {object|null} Policy question or null if not found
 */
export function getPolicyQuestionById(id) {
  return policyQuestions.find(q => q.id === id) || null;
}

/**
 * Create a new policy question
 * @param {string} question - The question text
 * @param {string} category - Question category
 * @param {string} description - Optional description
 * @param {array} tags - Optional tags
 * @returns {object} Created policy question
 */
export function addPolicyQuestion(question, category, description = '', tags = []) {
  const newQuestion = createPolicyQuestion(question, category, description, tags);
  policyQuestions.push(newQuestion);
  return newQuestion;
}

/**
 * Update a policy question
 * @param {string} id - Question ID
 * @param {object} updates - Fields to update
 * @returns {object|null} Updated question or null if not found
 */
export function updatePolicyQuestion(id, updates) {
  const index = policyQuestions.findIndex(q => q.id === id);
  if (index === -1) return null;
  
  const question = policyQuestions[index];
  
  // Update allowed fields
  if (updates.question) question.question = updates.question;
  if (updates.category) question.category = updates.category;
  if (updates.description !== undefined) question.description = updates.description;
  if (updates.tags) question.tags = updates.tags;
  
  question.updatedAt = new Date().toISOString();
  
  return question;
}

/**
 * Delete a policy question
 * @param {string} id - Question ID
 * @returns {boolean} True if deleted, false if not found
 */
export function deletePolicyQuestion(id) {
  const index = policyQuestions.findIndex(q => q.id === id);
  if (index === -1) return false;
  
  policyQuestions.splice(index, 1);
  return true;
}

/**
 * Increment usage count for a policy question
 * @param {string} id - Question ID
 * @returns {object|null} Updated question or null if not found
 */
export function incrementQuestionUsage(id) {
  const question = policyQuestions.find(q => q.id === id);
  if (!question) return null;
  
  question.usageCount++;
  return question;
}

/**
 * Get policy question categories
 * @returns {array} List of available categories
 */
export function getCategories() {
  return Object.values(PolicyCategory);
}

/**
 * Get statistics about policy questions
 * @returns {object} Statistics
 */
export function getPolicyQuestionStats() {
  const stats = {
    total: policyQuestions.length,
    byCategory: {},
    mostUsed: [],
  };
  
  // Count by category
  policyQuestions.forEach(q => {
    stats.byCategory[q.category] = (stats.byCategory[q.category] || 0) + 1;
  });
  
  // Get most used questions
  stats.mostUsed = [...policyQuestions]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5)
    .map(q => ({ id: q.id, question: q.question, usageCount: q.usageCount }));
  
  return stats;
}

export { PolicyCategory };
