// Interface between UI and Progress Persistence for saving/loading scenario data.
// JS JSDoc types for documentation only (compatible with CommonJS).

/**
 * @typedef {Object} ScenarioProgress
 * @property {string} scenarioId
 * @property {Array<string>} choices
 * @property {string} [lastNodeId]
 */

/**
 * @interface UIPersistenceInterface
 * saveProgress(progress: ScenarioProgress): void
 * loadProgress(): ScenarioProgress|null
 * clearProgress(): void
 * saveBadges(badges: Array<string>): void
 * loadBadges(): Array<string>
 * clearBadges(): void
 */
// Contract: all data is local to the browser, pure JS API.
