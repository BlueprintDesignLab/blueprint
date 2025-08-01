// UI <-> FeedbackSystem interface for getting plain-language feedback for user actions
// Types are for documentation only (JSDoc, pure JS)
/**
 * @typedef {Object} FeedbackRequest
 * @property {string} nodeId       // current scenario node
 * @property {string} choiceId     // user's choice
 * @property {Object} [context]    // any extra player context
 */
/**
 * @typedef {Object} FeedbackResponse
 * @property {string} text         // feedback message (plain language)
 * @property {Object} [impact]     // optional: structured impact details
 */
/**
 * @interface UIFeedbackInterface
 * getFeedback(req: FeedbackRequest): FeedbackResponse
 */
// Contract: always returns synchronously for current design (no async needed)
