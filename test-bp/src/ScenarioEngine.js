// Scenario Engine handles scenario logic, progression, and integrates feedback and persistence.
// Implements the UIEngineInterface, communicating with UI via events.
// For demo, uses a simple scenario structure.
// Types: see src/edges/interfaces/UIEngineInterface.js (JSDoc only)

class ScenarioEngineImpl {
  constructor(contentManager, feedbackSystem, persistence) {
    this.contentManager = contentManager;
    this.feedbackSystem = feedbackSystem;
    this.persistence = persistence;
    this.listeners = [];
    this.state = null;
    this.currentNode = null;
  }

  sendEvent(event) {
    switch (event.type) {
      case 'start': {
        // Load a scenario (hardcoded here)
        this.state = {
          name: event.onboarding.name,
          company: event.onboarding.company,
          currentNodeId: 'start',
          choices: [],
        };
        // Simple hardcoded content
        this.currentNode = {
          nodeId: 'start',
          text: 'Welcome to the scenario!',
          choices: [
            { id: 'choiceA', text: 'Investigate' },
            { id: 'choiceB', text: 'Ignore' },
          ]
        };
        this._notify({ type: 'narrative', nodeId: 'start', text: this.currentNode.text, choices: this.currentNode.choices });
        break;
      }
      case 'choose': {
        this.state.choices.push(event.choiceId);
        if (event.choiceId === 'choiceA') {
          this.currentNode = {
            nodeId: 'investigate',
            text: 'You chose to investigate. You find a clue.',
            choices: [
              { id: 'choiceEnd', text: 'Finish Scenario' },
            ]
          };
          this._notify({ type: 'narrative', nodeId: 'investigate', text: this.currentNode.text, choices: this.currentNode.choices });
        } else if (event.choiceId === 'choiceB') {
          this.currentNode = {
            nodeId: 'ignore',
            text: 'You ignored the situation. Nothing changes.',
            choices: [
              { id: 'choiceEnd', text: 'Finish Scenario' },
            ]
          };
          this._notify({ type: 'narrative', nodeId: 'ignore', text: this.currentNode.text, choices: this.currentNode.choices });
        } else if (event.choiceId === 'choiceEnd') {
          this._notify({ type: 'end', recap: 'Scenario finished.', summary: { choices: this.state.choices } });
        } else {
          this._notify({ type: 'error', message: 'Unknown choice.' });
        }
        break;
      }
      case 'reset': {
        this.state = null;
        this.currentNode = null;
        this._notify({ type: 'narrative', nodeId: 'start', text: 'Reset complete. Start a new scenario.', choices: [ { id: 'choiceA', text: 'Investigate' }, { id: 'choiceB', text: 'Ignore' } ] });
        break;
      }
      default:
        this._notify({ type: 'error', message: 'Unknown event type' });
    }
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  _notify(event) {
    this.listeners.forEach(cb => cb(event));
  }
}

// Export factory function as the API
function createScenarioEngine(contentManager, feedbackSystem, persistence) {
  return new ScenarioEngineImpl(contentManager, feedbackSystem, persistence);
}

module.exports = { createScenarioEngine };
