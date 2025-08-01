// ScenarioEngine <-> ScenarioContentManager interface
// Pure JS, no async, stateless content fetch/static queries only (see graph.yaml)
/**
 * @typedef {Object} ScenarioMeta
 * @property {string} id        // unique scenario id
 * @property {string} title     // display name
 * @property {string} [desc]    // short description
 */
/**
 * @typedef {Object} ScenarioContent
 * @property {string} id
 * @property {string} title
 * @property {Object} structure  // structure graph/tree (nodes, choices, full scenario logic)
 */
/**
 * @interface EngineContentInterface
 * listScenarios(): ScenarioMeta[]
 * getScenario(id: string): ScenarioContent|null
 */
// Contract: scenarios are bundled (not remotely loaded), all sync.
