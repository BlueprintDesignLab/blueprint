import OpenAI from "openai";

type LLMEvent =
  | { type: "text"; delta: string; raw?: any }
  | { type: "toolCallStart"; id: string; name: string; raw?: any }
  | { type: "toolCallArgs"; id: string; delta: string; raw?: any }
  | { type: "toolCallEnd"; id: string; name: string; args: string; raw?: any };

export interface LLMStream {
  // yields the neutral events above
  events(): AsyncIterable<LLMEvent>;
}

/* ---------- Concrete OpenAI adapter ---------- */
export class OpenAIAdapter implements LLMStream {
  constructor(
    private openai: OpenAI,
    private model: string,
    private prompt: string | any[],
    private tools: BPTool[],
    private instructions: string,
    private signal: AbortSignal
  ) {}

  async *events(): AsyncIterable<LLMEvent> {
    const raw = await this.openai.responses.create(
      { model: this.model, input: this.prompt, stream: true, tools: this.tools, instructions: this.instructions },
      { signal: this.signal }
    );

    for await (const ev of raw) {
      switch (ev.type) {
        case "response.output_text.delta":
          yield { type: "text", delta: ev.delta, raw: ev };
          break;

        case "response.output_item.added":
          if (ev.item.type === "function_call") {
            yield { type: "toolCallStart", id: ev.item.id ?? "", name: ev.item.name, raw: ev };
          }
          break;

        case "response.function_call_arguments.delta":
          yield { type: "toolCallArgs", id: ev.item_id, delta: ev.delta, raw: ev };
          break;

        case "response.output_item.done":
          if (ev.item.type === "function_call") {
            yield { type: "toolCallEnd", id: ev.item.id ?? "", name: ev.item.name, args: ev.item.arguments ?? "{}", raw: ev };
          }
          break;
      }
    }
  }
}