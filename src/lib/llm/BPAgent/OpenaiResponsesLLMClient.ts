import OpenAI from "openai";
import type { Tool as OpenAITool } from "openai/resources/responses/responses.mjs";
import type { ChatHistory } from "./ChatHistory";
import type { LLMClient } from "./OpenaiCompletionLLMClient";
import type { LLMEvent, LLMStream } from "./LLMClient";

export class OpenAIResponsesLLMClient implements LLMClient {
  constructor(private openai: OpenAI, private model: string) {}

  toThisTools(tools: any[]): any[] {
    return tools as OpenAITool[];
  }

  toThisHistory(history: ChatHistory): any[] {
    return history.turns.map(t => {
      switch (t.kind) {
        case "user":      return { type: "message", role: "user", content: t.content };
        case "assistant": return { type: "message", role: "assistant", content: t.content };
        case "toolCall":  return { type: "function_call", name: t.call.name, call_id: t.call.call_id, arguments: t.call.arguments };
        case "toolResult":return { type: "function_call_output", call_id: t.result.call_id, output: t.result.output };
      }
    });
  }

  createStream(
    history: ChatHistory,
    tools: any[],
    instructions: string,
    signal: AbortSignal
  ): LLMStream {
    const openaiTools = this.toThisTools(tools);
    const prompt = this.toThisHistory(history);

    return new OpenAIResponsesStream(this.openai, this.model, prompt, openaiTools, instructions, signal);
  }
}

class OpenAIResponsesStream implements LLMStream {
  constructor(
    private openai: OpenAI,
    private model: string,
    private prompt: any[],
    private tools: OpenAITool[],
    private instructions: string,
    private signal: AbortSignal
  ) {}

  async *events(): AsyncIterable<LLMEvent> {
    const stream = await this.openai.responses.create(
      { model: this.model, input: this.prompt, stream: true, tools: this.tools, instructions: this.instructions },
      { signal: this.signal }
    );

    for await (const ev of stream) {
      switch (ev.type) {
        case "response.output_text.delta":
          yield { type: "text", delta: ev.delta };
          break;

        case "response.output_item.added":
          if (ev.item.type === "function_call") {
            yield { type: "toolCallStart", id: ev.item.id ?? "", name: ev.item.name, call_id: ev.item.call_id };
          }
          break;

        case "response.function_call_arguments.delta":
          yield { type: "toolCallArgs", id: ev.item_id, delta: ev.delta };
          break;

        case "response.output_item.done":
          if (ev.item.type === "function_call") {
            yield { type: "toolCallEnd", id: ev.item.id ?? "", name: ev.item.name, args: ev.item.arguments ?? "{}", call_id: ev.item.call_id };
          }
          break;
      }
    }
  }
}