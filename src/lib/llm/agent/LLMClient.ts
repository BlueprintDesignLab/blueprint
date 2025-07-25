import OpenAI from "openai";

type LLMEvent =
  | { type: "text"; delta: string }
  | { type: "toolCallStart"; id: string; name: string; call_id: string }
  | { type: "toolCallArgs"; id: string; delta: string }
  | { type: "toolCallEnd"; id: string; name: string; args: string; call_id: string };

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

/* ---------- Concrete OpenAI adapter ---------- */
export class OpenAICompletionsAdapter implements LLMStream {
  constructor(
    private openai: OpenAI,
    private model: string,
    private prompt: any[],
    private tools: BPTool[],
    private instructions: string,
    private signal: AbortSignal
  ) {}

  async *events(): AsyncIterable<LLMEvent> {
    const stream = await this.openai.chat.completions.create(
      {
        model: this.model,
        messages: [
          { role: 'system', content: this.instructions },
          ...this.prompt
        ],
        stream: true,
        tools: this.tools          // chat endpoint *does* support tools
      },
      { signal: this.signal }
    );

    // tiny helper to remember what we’ve seen
    const toolCallBuffer: Record<number, { id: string; name: string; args: string }> = {};

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      /* ---------- 1. plain text ---------- */
      if (delta?.content) {
        yield { type: "text", delta: delta.content };
      }

      /* ---------- 2/3/4. tool-call events ---------- */
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index!;

          /* 2. toolCallStart (first time we see this index) */
          if (!toolCallBuffer[idx]) {
            toolCallBuffer[idx] = {
              id: tc.id ?? "",
              name: tc.function?.name ?? "",
              args: "",
            };
            yield { type: "toolCallStart", id: toolCallBuffer[idx].id, name: toolCallBuffer[idx].name, call_id: tc.id! };
          }

          /* 3. toolCallArgs (streaming argument delta) */
          const argDelta = tc.function?.arguments ?? "";
          if (argDelta) {
            toolCallBuffer[idx].args += argDelta;
            yield { type: "toolCallArgs", id: toolCallBuffer[idx].id, delta: argDelta };
          }
        }
      }

      /* 4. toolCallEnd (when we reach the final chunk) */
      if (chunk.choices[0]?.finish_reason === "tool_calls") {
        for (const call of Object.values(toolCallBuffer)) {
          yield { type: "toolCallEnd", id: call.id, name: call.name, args: call.args, call_id: call.id };
        }
      }
    }
  }
}