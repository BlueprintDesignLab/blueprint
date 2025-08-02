// AnthropicLLMClient.ts
import Anthropic from "@anthropic-ai/sdk";
import type { ChatHistory } from "./ChatHistory";
import type { LLMClient, LLMEvent, LLMStream } from "./LLMClient";

export class AnthropicLLMClient implements LLMClient {
  constructor(private anthropic: Anthropic, private model: string) {}

  /* ---------- helpers ---------- */
  private toAnthropicHistory(history: ChatHistory): Anthropic.MessageParam[] {
    return history.turns.map(t => {
      switch (t.kind) {
        case "user":
          return { role: "user" as const, content: t.content };
        case "assistant":
          return { role: "assistant" as const, content: t.content };
        case "toolCall":
          return {
            role: "assistant" as const,
            content: [
              {
                type: "tool_use" as const,
                id: t.call.id,
                name: t.call.name,
                input: JSON.parse(t.call.arguments || "{}"),
              },
            ],
          };
        case "toolResult":
          return {
            role: "user" as const,
            content: [
              {
                type: "tool_result" as const,
                tool_use_id: t.result.call_id,
                content: t.result.output,
              },
            ],
          };
      }
    });
  }

  private toAnthropicTools(tools: any[]): Anthropic.Tool[] {
    return tools.map((t: any) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters, // openai style JSONSchema
    }));
  }

  /* ---------- interface ---------- */

  toThisHistory(history: ChatHistory): any[] {
    // Same neutral format as OpenAI for symmetry
    return this.toAnthropicHistory(history);
  }

  toThisTools(tools: any[]): any[] {
    return this.toAnthropicTools(tools);
  }

  createStream(
    history: ChatHistory,
    tools: any[],
    instructions: string,
    signal: AbortSignal
  ): LLMStream {
    const messages = this.toAnthropicHistory(history);
    const anthropicTools = this.toAnthropicTools(tools);

    return new AnthropicStream(
      this.anthropic,
      this.model,
      instructions,
      messages,
      anthropicTools,
      signal
    );
  }
}

/* ------------------------------------------------------------------ */
/* AnthropicStream                                                    */
/* ------------------------------------------------------------------ */

class AnthropicStream implements LLMStream {
  constructor(
    private anthropic: Anthropic,
    private model: string,
    private system: string,
    private messages: Anthropic.MessageParam[],
    private tools: Anthropic.Tool[],
    private signal: AbortSignal
  ) {}

  async *events(): AsyncIterable<LLMEvent> {
    const stream = this.anthropic.messages.stream({
      model: this.model,
      max_tokens: 4096,
      system: this.system,
      messages: this.messages,
      tools: this.tools,
    });
    this.signal.addEventListener("abort", () => stream.controller.abort());

    /* ---- helpers ---- */
    const idByIndex   = new Map<number, string>();
    const nameByIndex = new Map<number, string>();
    const argsByIndex = new Map<number, string>();

    for await (const chunk of stream) {
      switch (chunk.type) {
        /* 1. toolCallStart */
        case "content_block_start":
          if (chunk.content_block.type === "tool_use") {
            const { id, name } = chunk.content_block;
            idByIndex.set(chunk.index, id);
            nameByIndex.set(chunk.index, name);
            argsByIndex.set(chunk.index, "");      // start empty buffer
            yield { type: "toolCallStart", id, name, call_id: id };
          }
          break;

        /* 2. text delta */
        case "content_block_delta":
          if (chunk.delta.type === "text_delta") {
            yield { type: "text", delta: chunk.delta.text };
          } else if (chunk.delta.type === "input_json_delta") {
            const id = idByIndex.get(chunk.index)!;
            const partial = chunk.delta.partial_json ?? "";
            argsByIndex.set(chunk.index, (argsByIndex.get(chunk.index) ?? "") + partial);
            yield { type: "toolCallArgs", id, delta: partial };
          }
          break;

        /* 3. toolCallEnd */
        case "content_block_stop": {
          const id   = idByIndex.get(chunk.index);
          const name = nameByIndex.get(chunk.index);
          const args = argsByIndex.get(chunk.index);
          if (id && name && args !== undefined) {
            yield { type: "toolCallEnd", id, name, args, call_id: id };
          }
          break;
        }

        /* ignore other events */
      }
    }
  }
}