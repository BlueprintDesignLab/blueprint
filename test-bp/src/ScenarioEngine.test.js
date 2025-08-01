const { createScenarioEngine } = require('./ScenarioEngine');

function fakeCM() { return {}; }
function fakeFS() { return {}; }
function fakePersistence() { return {}; }

describe('ScenarioEngine basic event flow', () => {
  it('runs a simple scenario path', done => {
    const engine = createScenarioEngine(fakeCM(), fakeFS(), fakePersistence());
    const updates = [];
    engine.onUpdate(ev => {
      updates.push(ev);
      const latest = updates[updates.length - 1];
      if (latest.type === 'narrative' && latest.nodeId === 'start') {
        engine.sendEvent({ type: 'choose', choiceId: 'choiceA' });
      }
      if (latest.type === 'narrative' && latest.nodeId === 'investigate') {
        engine.sendEvent({ type: 'choose', choiceId: 'choiceEnd' });
      }
      if (latest.type === 'end') {
        expect(latest.recap).toBe('Scenario finished.');
        expect(Array.isArray(latest.summary.choices)).toBe(true);
        done();
      }
    });
    engine.sendEvent({ type: 'start', onboarding: { name: 'Alice', company: 'AcmeCorp' } });
  });

  it('handles reset', done => {
    const engine = createScenarioEngine(fakeCM(), fakeFS(), fakePersistence());
    engine.onUpdate(ev => {
      if (ev.type === 'narrative' && ev.text.startsWith('Reset')) {
        done();
      }
    });
    engine.sendEvent({ type: 'reset' });
  });
});
