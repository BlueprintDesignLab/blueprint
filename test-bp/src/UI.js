// Top-level UI node: handles onboarding, scenario selection, user choices, feedback, and recap display.
// Talks to ScenarioEngine, ProgressPersistence, FeedbackSystem via interfaces (see /src/edges/interfaces/)

// To be wired with
// - ScenarioEngine (scenario flow, choices, state)
// - ProgressPersistence (save/load/reset progress)
// - FeedbackSystem (fetch feedback for choices)

// For demo, all interactions are synchronous and minimal HTML is used. In a real app, use proper events/rendering!

// ---- Helper: DOM builder ----
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'style' && typeof v === 'object') {
      Object.assign(el.style, v);
    } else {
      el.setAttribute(k, v);
    }
  });
  children.flat().forEach(child => {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else if (child) el.appendChild(child);
  });
  return el;
}

// ---- UI Main ----
function createUINode({ scenarioEngine, persistence, feedbackSystem }) {
  let root = null;
  let state = { onboarding: null, node: null, choices: [], feedback: null, recap: null };

  function render() {
    if (!root) return;
    root.innerHTML = '';
    if (!state.onboarding) {
      root.appendChild(
        h('div', {},
          h('h2', {}, 'Onboarding'),
          h('label', {}, 'Name: ', h('input', { id: 'username', type: 'text' })),
          h('label', {}, 'Company: ', h('input', { id: 'company', type: 'text' })),
          h('button', {
            onclick() {
              const name = root.querySelector('#username').value;
              const company = root.querySelector('#company').value;
              state.onboarding = { name, company };
              scenarioEngine.sendEvent({ type: 'start', onboarding: state.onboarding });
            }
          }, 'Start Scenario')
        )
      );
    } else if (state.recap) {
      root.appendChild(
        h('div', {},
          h('h2', {}, 'Recap'),
          h('p', {}, state.recap.recap),
          h('button', {
            onclick() {
              state = { onboarding: null, node: null, choices: [], feedback: null, recap: null };
              render();
            }
          }, 'Restart')
        )
      );
    } else if (state.node) {
      root.appendChild(
        h('div', {},
          h('h2', {}, state.node.text),
          h('ul', {}, state.node.choices.map(choice =>
            h('li', {},
              h('button', {
                onclick() {
                  state.choices.push(choice.id); // <-- FIX: track the chosen id
                  scenarioEngine.sendEvent({ type: 'choose', choiceId: choice.id });
                }
              }, choice.text)
            ))
          )
        )
      );
      if (state.feedback) {
        root.appendChild(h('div', { style: { background: '#eef', margin: '1em', padding: '0.5em' } },
          'Feedback: ', state.feedback.text));
      }
      root.appendChild(h('button', { onclick() { scenarioEngine.sendEvent({ type: 'reset' }); } }, 'Reset'));
    } else {
      root.appendChild(h('p', {}, 'Loading...'));
    }
  }

  // Listen for Engine events
  scenarioEngine.onUpdate(ev => {
    if (ev.type === 'narrative') {
      state.node = ev;
      state.feedback = null;
      state.recap = null;
      // Request feedback (for this node, but only on later steps)
      if (state.choices.length) {
        const choiceId = state.choices[state.choices.length - 1];
        state.feedback = feedbackSystem.getFeedback({ nodeId: ev.nodeId, choiceId });
      }
    } else if (ev.type === 'end') {
      state.recap = ev;
    } else if (ev.type === 'error') {
      alert(ev.message);
    }
    render();
  });

  return {
    mount(el) {
      root = el;
      render();
    }
  };
}

module.exports = { createUINode };
