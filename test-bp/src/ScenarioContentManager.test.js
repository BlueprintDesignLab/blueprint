const { ScenarioContentManager } = require('./ScenarioContentManager');

describe('ScenarioContentManager', () => {
  let cm;
  beforeEach(() => {
    cm = new ScenarioContentManager();
  });

  it('lists all scenarios', () => {
    const list = cm.listScenarios();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty('id');
    expect(list[0]).toHaveProperty('title');
  });

  it('gets scenario by id', () => {
    const meta = cm.listScenarios()[0];
    const scenario = cm.getScenario(meta.id);
    expect(scenario.id).toBe(meta.id);
    expect(scenario).toHaveProperty('structure');
    expect(scenario).not.toHaveProperty('desc');
  });

  it('returns null for missing id', () => {
    expect(cm.getScenario('doesnotexist')).toBeNull();
  });
});
