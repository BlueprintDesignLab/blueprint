// ScenarioEngine <-> FeedbackSystem interface
// Pure JS, synchronous API for generating contextual feedback per user choice

/**
 * @typedef {Object} FeedbackQuery
 * @property {string} nodeId    // current scenario node ID
 * @property {string} choiceId  // user's selected choice
 * @property {Object} [context] // optional, e.g. user or scenario context
 */

/**
 * @typedef {Object} FeedbackResult
 * @property {string} text      // explanation/feedback message
 * @property {Object} [impact]  // optional: details about change in scenario state, score, etc
 */

/**
 * @interface EngineFeedbackInterface
 * getFeedback(query: FeedbackQuery): FeedbackResult
 */
// Contract: always synchronous, pure JS data exchange
