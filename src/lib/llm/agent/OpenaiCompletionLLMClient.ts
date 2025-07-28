import type OpenAI from "openai";
import type { ChatHistory } from "./ChatHistory";
import type { LLMEvent, LLMStream } from "./LLMClient";

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

export class OpenAICompletionsLLMClient implements LLMClient {
  constructor(private openai: OpenAI, private model: string) {}

  toThisHistory(history: ChatHistory): any[] {
    const completionHistory = [
      ...history.turns.map(t => {
        switch (t.kind) {
          case "user":      return { role: "user", content: t.content };
          case "assistant": return { role: "assistant", content: t.content, tool_calls: undefined };
          case "toolCall":  return { role: "assistant", content: null, tool_calls: [{ id: t.call.id, type: "function", function: { name: t.call.name, arguments: t.call.arguments } }] };
          case "toolResult":return { role: "tool", tool_call_id: t.result.call_id, content: t.result.output };
        }
      })
    ]
    // console.log(completionHistory);
    return completionHistory;
  }

  toThisTools(tools: any[]): any[] {
    return tools.map((t: any) => ({ type: "function", function: t }));
  }

  createStream(
    history: ChatHistory,
    tools: any[],
    instructions: string,
    signal: AbortSignal
  ): LLMStream {
    const openaiTools = this.toThisTools(tools);
    const messages = [
      { role: "system", content: instructions },
      ...this.toThisHistory(history)
    ]

    return new OpenAICompletionsStream(this.openai, this.model, messages, openaiTools, signal);
  }
}

class OpenAICompletionsStream implements LLMStream {
  constructor(
    private openai: OpenAI,
    private model: string,
    private messages: any[],
    private tools: any[],
    private signal: AbortSignal
  ) {}

  async *events(): AsyncIterable<LLMEvent> {
    const stream = await this.openai.chat.completions.create(
      { model: this.model, messages: this.messages, stream: true, tools: this.tools, parallel_tool_calls: false },
      { signal: this.signal }
    );

    const toolCallBuffer: Record<number, { id: string; name: string; args: string }> = {};

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      if (delta?.content) yield { type: "text", delta: delta.content };

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index!;
          if (!toolCallBuffer[idx]) {
            toolCallBuffer[idx] = { id: tc.id ?? "", name: tc.function?.name ?? "", args: "" };
            yield { type: "toolCallStart", id: toolCallBuffer[idx].id, name: toolCallBuffer[idx].name, call_id: tc.id! };
          }
          const argDelta = tc.function?.arguments ?? "";
          if (argDelta) {
            toolCallBuffer[idx].args += argDelta;
            yield { type: "toolCallArgs", id: toolCallBuffer[idx].id, delta: argDelta };
          }
        }
      }

      if (chunk.choices[0]?.finish_reason === "tool_calls") {
        for (const call of Object.values(toolCallBuffer)) {
          yield { type: "toolCallEnd", id: call.id, name: call.name, args: call.args, call_id: call.id };
        }
      }
    }
  }
}