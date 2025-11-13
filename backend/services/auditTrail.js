/**
 * Audit Trail Service
 * Manages audit event logging and retrieval
 * 
 * NOTE: In-memory storage for MVP. Replace with database for production.
 */

import { createAuditEvent, AuditEventType } from '../schemas/auditEvent.js';

// In-memory storage (replace with database in production)
const auditEvents = [];

/**
 * Log an audit event
 * @param {string} type - Event type from AuditEventType
 * @param {object} data - Event-specific data
 * @param {string} userId - Optional user identifier
 * @returns {object} Created audit event
 */
export function logAuditEvent(type, data = {}, userId = 'anonymous') {
  const event = createAuditEvent(type, data, userId);
  auditEvents.push(event);
  
  // Keep only last 1000 events in memory to prevent overflow
  if (auditEvents.length > 1000) {
    auditEvents.shift();
  }
  
  return event;
}

/**
 * Get all audit events with optional filtering
 * @param {object} filters - Optional filters (type, userId, startDate, endDate)
 * @param {number} limit - Maximum number of events to return
 * @param {number} offset - Offset for pagination
 * @returns {array} Filtered audit events
 */
export function getAuditEvents(filters = {}, limit = 100, offset = 0) {
  let filtered = [...auditEvents];
  
  // Filter by event type
  if (filters.type) {
    filtered = filtered.filter(event => event.type === filters.type);
  }
  
  // Filter by user ID
  if (filters.userId) {
    filtered = filtered.filter(event => event.userId === filters.userId);
  }
  
  // Filter by date range
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    filtered = filtered.filter(event => new Date(event.timestamp) >= startDate);
  }
  
  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    filtered = filtered.filter(event => new Date(event.timestamp) <= endDate);
  }
  
  // Sort by timestamp (newest first)
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Apply pagination
  const paginated = filtered.slice(offset, offset + limit);
  
  return {
    events: paginated,
    total: filtered.length,
    limit,
    offset,
  };
}

/**
 * Get audit event statistics
 * @returns {object} Statistics about audit events
 */
export function getAuditStats() {
  const stats = {
    total: auditEvents.length,
    byType: {},
    recentActivity: [],
  };
  
  // Count by type
  auditEvents.forEach(event => {
    stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
  });
  
  // Get last 10 events
  stats.recentActivity = [...auditEvents]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);
  
  return stats;
}

/**
 * Clear all audit events (for testing purposes)
 */
export function clearAuditEvents() {
  auditEvents.length = 0;
}

export { AuditEventType };
