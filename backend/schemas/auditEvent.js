/**
 * Audit Event Schema
 * Defines the structure for audit trail events
 */

export const AuditEventType = {
  QUESTION_ASKED: 'question_asked',
  EXPORT_YAML: 'export_yaml',
  EXPORT_JSON: 'export_json',
  EXPORT_PDF: 'export_pdf',
  EXPORT_README: 'export_readme',
  VOTE_CAST: 'vote_cast',
  POLICY_QUESTION_CREATED: 'policy_question_created',
  POLICY_QUESTION_UPDATED: 'policy_question_updated',
  POLICY_QUESTION_DELETED: 'policy_question_deleted',
};

/**
 * Creates an audit event object
 * @param {string} type - Event type from AuditEventType
 * @param {object} data - Event-specific data
 * @param {string} userId - Optional user identifier
 * @returns {object} Audit event object
 */
export function createAuditEvent(type, data = {}, userId = 'anonymous') {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    timestamp: new Date().toISOString(),
    userId,
    data,
  };
}

export const AuditEventSchema = {
  type: 'object',
  required: ['id', 'type', 'timestamp', 'userId', 'data'],
  properties: {
    id: { type: 'string' },
    type: { type: 'string', enum: Object.values(AuditEventType) },
    timestamp: { type: 'string', format: 'date-time' },
    userId: { type: 'string' },
    data: { type: 'object' },
  },
};
