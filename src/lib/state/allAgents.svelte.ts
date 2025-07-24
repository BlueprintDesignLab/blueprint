import { Agent } from '$lib/llm/agent/Agent.js';
import type { UIUpdaterCallbacks } from '$lib/llm/agent/StreamHandler.js';
import { getSystemPromptFor } from '$lib/llm/agent/SystemPrompts';
import { toolsFor } from '$lib/llm/agent/ToolRole';
import { edgeCodePrompt } from '$lib/llm/edgeCoderPrompt';
import { SvelteMap } from 'svelte/reactivity';
import { agentRole } from './agentRole.svelte';

export type NodeId = string;

export type ChatState = {
  agent: Agent,
  ch: any[],
  generating: boolean,
}

class AgentAndChatState {
  agent: Agent;
  ch: any[] = $state([]);
  generating: boolean = $state(false);

  constructor(role: AgentRoles, callbacks: UIUpdaterCallbacks) {
    let sysPrompt = getSystemPromptFor(role);

    if (role === "code") {
      if (agentRole.node === "All Edges") {
        // console.log(edgeCodePrompt);
        sysPrompt = edgeCodePrompt;
      } else {
        sysPrompt += `Your focus node is ${agentRole.node}`
      }
    }

    this.agent = new Agent({ chat: [] }, sysPrompt, toolsFor(role), callbacks);
  }
}

const developerAgentMap = new SvelteMap<NodeId, AgentAndChatState>();

export const planAgent = createAgentAndChatState('plan');
export const architectAgent = createAgentAndChatState('architect');
export const edgeCodingAgent = createAgentAndChatState('code');

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
        store.agent.abort();
      },
    };

    // -----------------------------------------------------------------
    const store: AgentAndChatState = new AgentAndChatState(role, callbacks);
    return store;
}

export function createDeveloperAgentForNode(nodeId: NodeId): AgentAndChatState {
  if (!developerAgentMap.has(nodeId)) {
    const store = createAgentAndChatState('code');
    developerAgentMap.set(nodeId, store);
    return store;
  }

  return developerAgentMap.get(nodeId)!;
}

export function getDeveloperAgentForNode(nodeId: NodeId): AgentAndChatState {
  return developerAgentMap.get(nodeId)!;
}
