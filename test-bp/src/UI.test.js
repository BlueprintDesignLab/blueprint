const { createUINode } = require('./UI');

describe('UI Node', () => {
  let scenarioEngine, persistence, feedbackSystem, container;

  beforeEach(() => {
    // Mocks for edge interfaces:
    scenarioEngine = {
      sendEvent: jest.fn(),
      onUpdate: jest.fn((cb) => { scenarioEngine._cb = cb; }),
    };
    persistence = {
      saveProgress: jest.fn(),
      loadProgress: jest.fn(() => null),
      clearProgress: jest.fn(),
      saveBadges: jest.fn(),
      loadBadges: jest.fn(() => []),
      clearBadges: jest.fn(),
    };
    feedbackSystem = {
      getFeedback: jest.fn(() => ({ text: 'Great choice!' })),
    };
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders onboarding and starts scenario', () => {
    const ui = createUINode({ scenarioEngine, persistence, feedbackSystem });
    ui.mount(container);
    // Fill onboarding
    container.querySelector('#username').value = 'Alice';
    container.querySelector('#company').value = 'Wonderland Inc.';
    container.querySelector('button').click();
    expect(scenarioEngine.sendEvent).toHaveBeenCalledWith({ type: 'start', onboarding: { name: 'Alice', company: 'Wonderland Inc.' } });
  });

  it('renders a scenario node and choices', () => {
    const ui = createUINode({ scenarioEngine, persistence, feedbackSystem });
    ui.mount(container);
    // Simulate onboarding done:
    container.querySelector('#username').value = 'Bob';
    container.querySelector('#company').value = 'Acme';
    container.querySelector('button').click();

    scenarioEngine._cb({ type: 'narrative', nodeId: 'n1', text: 'Welcome!', choices: [ { id: 'c1', text: 'Go on' } ] });
    // Should render button for choice
    expect(container.innerHTML).toContain('Welcome!');
    expect(container.querySelector('button').textContent).toMatch(/Go on/);
  });

  it('renders feedback message after making a choice', () => {
    const ui = createUINode({ scenarioEngine, persistence, feedbackSystem });
    ui.mount(container);
    // Simulate onboarding done:
    container.querySelector('#username').value = 'Eve';
    container.querySelector('#company').value = 'Cipher';
    container.querySelector('button').click();

    // First narrative
    scenarioEngine._cb({ type: 'narrative', nodeId: 'n42', text: 'Decision time', choices: [ { id: 'c99', text: 'Pick' } ] });
    // Simulate making a choice
    container.querySelector('ul button').click();
    // The UI does NOT fetch feedback yet — it will after the engine sends another narrative.
    expect(feedbackSystem.getFeedback).not.toHaveBeenCalled();

    // Second narrative, as if in response to the choice (UI should now call getFeedback)
    scenarioEngine._cb({ type: 'narrative', nodeId: 'nX', text: 'After decision', choices: [ { id: 'c2', text: 'Continue' } ] });
    expect(feedbackSystem.getFeedback).toHaveBeenCalled();
  });

  it('shows recap and supports restart', () => {
    const ui = createUINode({ scenarioEngine, persistence, feedbackSystem });
    ui.mount(container);
    // Simulate onboarding done:
    container.querySelector('#username').value = 'Zoe';
    container.querySelector('#company').value = 'Plants';
    container.querySelector('button').click();

    scenarioEngine._cb({ type: 'end', recap: 'Done!', summary: { score: 5 } });
    expect(container.innerHTML).toContain('Recap');
    container.querySelector('button').click(); // Restart
    expect(container.innerHTML).toContain('Onboarding');
  });
});
