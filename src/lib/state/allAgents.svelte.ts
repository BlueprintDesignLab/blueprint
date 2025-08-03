import { Agent } from '$lib/llm/BPAgent/BPAgent';

import { getSystemPromptFor } from '$lib/llm/systemPrompts';
import { toolsFor } from '$lib/llm/Tool/ToolRole';
import { edgeCodePrompt } from '$lib/llm/edgeCoderPrompt';

import { tick } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { agentRole } from './agentRole.svelte';
import { toast } from 'svelte-sonner';
import { ChatHistory, type NeutralTurn } from '$lib/llm/BPAgent/ChatHistory';

export type NodeId = string;

type DisplayTurn = 
  | { kind: "user"; content: string }
  | { kind: "assistant"; content: string } 
  | { kind: "tool", id: string, tool: any, approvalId?: string, checkpoint?: string } 

function toDisplayTurn(nt: NeutralTurn): DisplayTurn {
  switch (nt.kind) {
    case "user":
    case "assistant":
      return nt;

    case "toolCall":
      return {
        kind: "tool",
        id: nt.call.id,
        tool: { name: nt.call.name, status: "resolved", args: nt.call.arguments, call_id: nt.call.call_id },
      };

    case "toolResult":
      // map result into the same DisplayTurn tool entry
      return {
        kind: "tool",
        id: nt.result.call_id,   // reuse call_id as id
        tool: { output: nt.result.output, status: "resolved", call_id: nt.result.call_id },
      };

    /* exhaustive-check helper – remove in prod */
    default:
      const _exhaustive: never = nt;
      throw new Error(`Unhandled NeutralTurn kind: ${_exhaustive}`);
  }
}

const rafThrottle = <A extends any[]>(fn: (...a: A) => void) => {
  let id: number | undefined;
  return (...args: A) => {
    if (id !== undefined) return;            // already scheduled
    id = requestAnimationFrame(() => {
      fn(...args);
      id = undefined;
    });
  };
};

export class AgentAndChatState {
  agent: Agent;

  history: ChatHistory;
  ch: DisplayTurn[] = $state([]);

  generating = $state(false);
  chDiv: HTMLDivElement | null = $state(null);

  constructor(role: AgentRoles, node?: NodeId) {
    let sysPrompt = getSystemPromptFor(role, node);

    // console.log(role + (node ?? ""));
    const history = new ChatHistory(role + (node ?? ""));
    this.history = history;

    (async () => {
      await history.load();
      
      for (const turn of history.turns) {
        this.ch.push(toDisplayTurn(turn));
      }
    })();

    this.agent = new Agent(history, sysPrompt, toolsFor(role), {
      streamDelta: this.streamDelta.bind(this),
      showTool:    this.showTool.bind(this),
      stopGenerating: this.stopGenerating.bind(this)
    });
  }

  clear() {
    this.history.clear();
    this.ch = [];
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

    const TOLERANCE = 100;
    const autoscroll =
      (this.chDiv.offsetHeight + this.chDiv.scrollTop) > (this.chDiv.scrollHeight - TOLERANCE);
    if (autoscroll) this.scrollToBottom();
  }

  private assistantDeltaBuffer = '';
  private flushAssistantDelta = rafThrottle(() => {
    const last = this.ch.at(-1);
    if (last?.kind === 'assistant') {
      last.content += this.assistantDeltaBuffer;
      this.assistantDeltaBuffer = '';
      this.scrollIfNearBottom();
    }
  });

  streamDelta(delta: string) {
    // accumulate
    this.assistantDeltaBuffer += delta;

    // ensure the last element is an assistant turn
    const last = this.ch.at(-1);
    if (!last || last.kind !== 'assistant') {
      this.ch.push({ kind: 'assistant', content: '' });
    }

    // throttle the DOM update
    this.flushAssistantDelta();
  }

  private toolDeltaBuffer = new Map<string, string>();

  private flushToolDeltas = rafThrottle(() => {
    for (const [id, delta] of this.toolDeltaBuffer) {
      const i = this.ch.findIndex(
        (o): o is DisplayTurn & { kind: 'tool' } =>
          o.kind === 'tool' && o.id === id
      );
      if (i !== -1 && this.ch[i].kind === "tool") {
        (this.ch[i].tool as any).args =
          ((this.ch[i].tool as any).args ?? '') + delta;
      }
    }
    this.toolDeltaBuffer.clear();
    this.scrollIfNearBottom();
  });

  showTool(payload: {
    id: string;
    tool?: string;
    delta?: string;
    approvalId?: string;
    checkpoint?: string;
  }) {
    const i = this.ch.findIndex(
      (o): o is DisplayTurn & { kind: "tool" } =>
        o.kind === "tool" && o.id === payload.id
    );

    if (i === -1) {
      const chLast = this.ch.at(-1);
      if (chLast?.kind === "assistant") {
        if (chLast.content === "") {
          this.ch.pop();
        }
      }

      this.ch.push({
        kind: "tool",
        id: payload.id,
        tool: payload.tool,
        ...(payload.approvalId && { approvalId: payload.approvalId }),
        ...(payload.checkpoint && { checkpoint: payload.checkpoint }),
      });
    } else {
      const existing = this.ch[i];

      if (existing.kind === "tool") {
        if (payload.delta !== undefined) {
          this.toolDeltaBuffer.set(
            payload.id,
            (this.toolDeltaBuffer.get(payload.id) ?? '') + payload.delta
          );
          this.flushToolDeltas();
          return;

        } else {
          this.flushToolDeltas();

          this.ch[i] = {
            kind: "tool",
            id: payload.id,
            tool: payload.tool,
            ...(payload.approvalId && { approvalId: payload.approvalId }),
            ...(payload.checkpoint && { checkpoint: payload.checkpoint }),
          };
        }
      }
    }

    this.scrollIfNearBottom();
  }

  send(question: string): boolean {
    if (this.generating) return false;
    if (question.trim() === "") return false;

    const last = this.ch.at(-1);
    if (last?.kind === "tool" && last.approvalId !== undefined) return false;

    const userMessage: DisplayTurn = { kind: "user", content: question };
    this.ch.push(userMessage);
    this.ch.push({kind: "assistant", content: ""});

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
  }
}

export const developerAgentMap = new SvelteMap<NodeId, AgentAndChatState>();

export const planAgent = new AgentAndChatState("plan")
export const architectAgent = new AgentAndChatState('architect');
export const edgeCodingAgent = new AgentAndChatState('code', "Project Scaffolder");

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
  if (agentRole === 'code') return edgeCodingAgent;

  return null;
}

export function getDeveloperAgentForNode(nodeId: NodeId): AgentAndChatState {
  if (nodeId === 'Project Scaffolder') {
    return edgeCodingAgent;
  }

  return developerAgentMap.get(nodeId)!;
}

