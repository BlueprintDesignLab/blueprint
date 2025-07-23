import { Agent } from '$lib/llm/agent/Agent.js';
import type { UIUpdaterCallbacks } from '$lib/llm/agent/StreamHandler.js';

export type NodeId = string;

class AgentAndChatState {
  agent: Agent;
  ch: any[] = $state([]);
  generating: boolean = $state(false);

  constructor(role: AgentRoles, callbacks: UIUpdaterCallbacks) {
    this.agent = new Agent({ chat: [] }, role, callbacks);
  }
}

const developerAgentMap = new Map<NodeId, AgentAndChatState>();

export const planAgent = createAgentAndChatState('plan');
export const architectAgent = createAgentAndChatState('architect');

function createAgentAndChatState(role: AgentRoles): AgentAndChatState {
    const callbacks: UIUpdaterCallbacks = {
      streamDelta(delta: string) {
        const st = store;               // always the live object
        if (st.ch.at(-1)?.role !== 'assistant') {
          st.ch.push({ role: 'assistant', content: '' });
        }
        st.ch.at(-1)!.content += delta;
      },

      showTool(payload: any) {
        const st = store;
        const i = st.ch.findIndex((o) => o?.id === payload.id);
        if (i === -1) {
          if (st.ch.at(-1)?.content === '') st.ch.pop();
          st.ch.push(payload);
        } else if ('delta' in payload) {
          st.ch[i].tool.args += payload.delta;
        } else {
          st.ch[i] = payload;
        }
      },

      stopGenerating() {
        store.generating = false;
        store.agent.stop(); // whatever your agent exposes
      },
    };

    // -----------------------------------------------------------------
    const store: AgentAndChatState = new AgentAndChatState(role, callbacks);
    return store;
}

export function getDeveloperAgentForNode(nodeId: NodeId): AgentAndChatState {
  if (!developerAgentMap.has(nodeId)) {
    const store = createAgentAndChatState('code');
    developerAgentMap.set(nodeId, store);
  }

  return developerAgentMap.get(nodeId)!;
}
