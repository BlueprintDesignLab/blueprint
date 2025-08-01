// Interface between UI and Scenario Engine as plain JSDoc comments for type hints only (not enforced)

/**
 * @typedef {{ type: 'start', onboarding: { name: string, company: string } } |
 *           { type: 'choose', choiceId: string } |
 *           { type: 'reset' }} UIToEngine
 */

/**
 * @typedef {{ type: 'narrative', nodeId: string, text: string, choices: Array<{ id: string, text: string }> } |
 *           { type: 'feedback', text: string, impact?: Object } |
 *           { type: 'end', recap: string, summary: Object } |
 *           { type: 'error', message: string }} EngineToUI
 */

/**
 * @interface UIEngineInterface
 * sendEvent(event: UIToEngine): void
 * onUpdate(callback: function(EngineToUI)): void
 */

// This file acts as documentation only, no actual code to export for CommonJS compatibility.
