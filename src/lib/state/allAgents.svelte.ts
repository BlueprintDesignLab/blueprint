import { Agent } from '$lib/llm/BPAgent/BPAgent';

import { getSystemPromptFor } from '$lib/llm/SystemPrompts';
import { toolsFor } from '$lib/llm/Tool/ToolRole';
import { edgeCodePrompt } from '$lib/llm/edgeCoderPrompt';

import { tick } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { agentRole } from './agentRole.svelte';
import { toast } from 'svelte-sonner';

export type NodeId = string;

export class AgentAndChatState {
  agent: Agent;
  ch: any[] = $state([]);
  generating = $state(false);
  chDiv: HTMLDivElement | null = $state(null);

  constructor(role: AgentRoles, node?: NodeId) {
    let sysPrompt = getSystemPromptFor(role);

    if (role === "code") {
      if (node === "All Edges") {
        sysPrompt = edgeCodePrompt;
      } else {
        sysPrompt += `Your focus node is ${node}`
      }
    }

    this.agent = new Agent({ chat: [] }, sysPrompt, toolsFor(role), {
      streamDelta: this.streamDelta.bind(this),
      showTool:    this.showTool.bind(this),
      stopGenerating: this.stopGenerating.bind(this)
    });
  }

  stopGenerating() {
    this.generating = false;
    this.agent.abort();
  }

  scrollToBottom() {
    tick().then(() => {
      this.chDiv = this.chDiv as HTMLDivElement;
      this.chDiv.scrollTo(0, this.chDiv.scrollHeight);
    });
  }

  scrollIfNearBottom() {
    if (!this.chDiv) return;

    const TOLERANCE = 150;
    const autoscroll =
      (this.chDiv.offsetHeight + this.chDiv.scrollTop) > (this.chDiv.scrollHeight - TOLERANCE);
    if (autoscroll) this.scrollToBottom();
  }

  streamDelta(delta: string) {
    if (this.ch.at(-1)?.role !== 'assistant') {
      this.ch.push({ role: 'assistant', content: '' });
    }
    this.ch.at(-1)!.content += delta;
    this.scrollIfNearBottom();
  }

  showTool(payload: any) {
    const i = this.ch.findIndex((o) => o?.id === payload.id);
    if (i === -1) {
      if (this.ch.at(-1)?.content === '') this.ch.pop();
      this.ch.push(payload);
    } else if ('delta' in payload) {
      this.ch[i].tool.args += payload.delta;
    } else {
      this.ch[i] = payload;
    }
    this.scrollIfNearBottom();
  }

  send(question: string): boolean {
    if (this.generating) return false;
    if (question.trim() === "") return false;
    if ("approvalId" in (this.ch.at(-1) ?? {})) return false;

    const userMessage = { role: "user", content: question };
    this.ch.push(userMessage);

    this.generating = true;
    (async () => {
      try {
        await this.agent.run(question);
      } catch (e) {
        toast.error(String(e));
        this.streamDelta(String(e));
        this.stopGenerating();
        throw e;
      }
    })();

    this.scrollIfNearBottom();
    return true;
  };
}

export const developerAgentMap = new SvelteMap<NodeId, AgentAndChatState>();

export const planAgent = new AgentAndChatState("plan")
export const architectAgent = new AgentAndChatState('architect');
export const edgeCodingAgent = new AgentAndChatState('code', "All Edges");

export const currAgentAndChatState = {
  get current() {
    let mainAgent = getAgentForRole(agentRole.agentRole);
    if (mainAgent) {
      mainAgent.scrollToBottom();
      return mainAgent;
    }
    const nodeAgent = getDeveloperAgentForNode(agentRole.node);
    nodeAgent.scrollToBottom();

    return nodeAgent;
  },
};

export function getAgentForRole(agentRole: AgentRoles): AgentAndChatState | null {
  if (agentRole === 'plan') return planAgent;
  if (agentRole === 'architect') return architectAgent;

  return null;
}

export function getDeveloperAgentForNode(nodeId: NodeId): AgentAndChatState {
  if (nodeId === 'All Edges') {
    return edgeCodingAgent;
  }

  return developerAgentMap.get(nodeId)!;
}

