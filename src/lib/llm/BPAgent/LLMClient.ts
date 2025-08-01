import type { ChatHistory } from "./ChatHistory";

export type LLMEvent =
  | { type: "text"; delta: string }
  | { type: "toolCallStart"; id: string; name: string; call_id: string }
  | { type: "toolCallArgs"; id: string; delta: string }
  | { type: "toolCallEnd"; id: string; name: string; args: string; call_id: string };

export interface LLMStream {
  // yields the neutral events above
  events(): AsyncIterable<LLMEvent>;
}

export interface LLMClient {
  createStream(
    history: ChatHistory,
    tools: any[], // neutral tool schema
    instructions: string,
    signal: AbortSignal
  ): LLMStream;

  toThisHistory(history: ChatHistory): any[];
  toThisTools(tools: any[]): any[];
}