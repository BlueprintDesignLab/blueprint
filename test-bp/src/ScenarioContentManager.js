// ScenarioContentManager loads scenario metadata and structures from bundled files (JS or JSON in /src/scenarios/)
// Implements: EngineContentInterface (see src/edges/interfaces/EngineContentInterface.js)

// For this implementation, we'll hardcode a couple of scenarios. In real usage, scan /src/scenarios/.
// All methods are synchronous.

const SCENARIOS = [
  {
    id: 'welcome',
    title: 'Welcome Demo',
    desc: 'A short introductory scenario.',
    structure: {
      nodes: {
        start: { text: 'Welcome! Begin your journey.', choices: ['advance'] },
        advance: { text: 'You finished the demo!', choices: [] },
      },
      edges: {
        start: { advance: 'Next Step' },
      },
      firstNode: 'start'
    },
  },
  {
    id: 'investigation',
    title: 'Investigation',
    desc: 'Learn the basics of following up on clues.',
    structure: {
      nodes: {
        intro: { text: 'A clue arrives. Will you pursue it?', choices: ['follow', 'ignore'] },
        follow: { text: 'You find more information!', choices: ['finish'] },
        ignore: { text: 'You miss the opportunity.', choices: ['finish'] },
        finish: { text: 'Case closed.', choices: [] },
      },
      edges: {
        intro: { follow: 'Follow the clue', ignore: 'Ignore the clue' },
        follow: { finish: 'Wrap up' },
        ignore: { finish: 'Wrap up' },
      },
      firstNode: 'intro',
    },
  },
];

class ScenarioContentManager {
  // Returns list of scenario metadata ({ id, title, desc })
  listScenarios() {
    return SCENARIOS.map(({ id, title, desc }) => ({ id, title, desc }));
  }

  // Gets the full scenario (id, title, structure)
  getScenario(id) {
    const found = SCENARIOS.find(s => s.id === id);
    if (!found) return null;
    // Omit description in structure (as per contract)
    return { id: found.id, title: found.title, structure: found.structure };
  }
}

module.exports = { ScenarioContentManager };
