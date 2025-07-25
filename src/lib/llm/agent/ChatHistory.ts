// const CHAT_HISTORY_LIMIT = 99;
// const TOOL_HISTORY_LIMIT = 99;

// export class ChatHistory {
//   chat: ChatTurn[] = [];
//   tools: any[] = [];

//   appendChat = (t: ChatTurn) => pushLimited(this.chat, {...t, timestamp: new Date().toISOString() }, CHAT_HISTORY_LIMIT);
//   appendTool = (t: any) => pushLimited(this.tools, {...t, timestamp: new Date().toISOString() }, TOOL_HISTORY_LIMIT);

//   buildPrompt(systemFallback: string) {
//     const combined = [...this.chat, ...this.tools]
//       .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

//     let prompt = combined.map(i => "role" in i
//         ? `${i.role}: ${i.content}`
//         : `BPTool: ${JSON.stringify(i)}`).join("\n");
//     prompt += "\n" + systemFallback;
//     return prompt;
//   }

//   buildOpenaiPrompt(): any[] {
//     const combined = [...this.chat, ...this.tools]
//       .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
//       .map(({ timestamp, ...rest }) => rest);

//     return combined;
//   }

//   async load() { /* read from disk */ }
//   async persist() { /* write to disk */ }
// }

// function pushLimited<T>(arr: T[], item: T, limit: number) {
//   arr.push(item);
//   if (arr.length > limit) arr.splice(0, arr.length - limit);
// }

// ---------- neutral data model ----------
type ToolCall = {
  id: string;
  name: string;
  arguments: string;
  call_id: string;
};
type ToolResult = {
  call_id: string;
  output: string;
};

type NeutralTurn =
  | { kind: "user"; content: string }
  | { kind: "assistant"; content: string }
  | { kind: "toolCall"; call: ToolCall }
  | { kind: "toolResult"; result: ToolResult };

export class ChatHistory {
  turns: NeutralTurn[] = [];

  addUser(text: string)           { this.turns.push({ kind: "user", content: text }); }
  addAssistant(text: string)     { this.turns.push({ kind: "assistant", content: text ?? "" }); }
  addToolCall(call: ToolCall)     { this.turns.push({ kind: "toolCall", call }); }
  addToolResult(res: ToolResult)  { this.turns.push({ kind: "toolResult", result: res }); }

  /* ---------- Responses API ---------- */
  toResponsesMessages(): any[] {
    return this.turns.map(t => {
      switch (t.kind) {
        case "user":        return { type: "message", role: "user", content: t.content };
        case "assistant":   return { type: "message", role: "assistant", content: t.content };
        case "toolCall":    return { type: "function_call", call_id: t.call.call_id, name: t.call.name, arguments: t.call.arguments };
        case "toolResult":  return { type: "function_call_output", call_id: t.result.call_id, output: t.result.output };
      }
    });
  }

  /* ---------- Chat-Completions API ---------- */
  toChatMessages(): any[] {
    return this.turns.map(t => {
      switch (t.kind) {
        case "user":        return { role: "user", content: t.content };
        case "assistant":   return { role: "assistant", content: t.content, tool_calls: undefined };
        case "toolCall":    return { role: "assistant", content: null, tool_calls: [{ id: t.call.id, type: "function", function: { name: t.call.name, arguments: t.call.arguments } }] };
        case "toolResult":  return { role: "tool", tool_call_id: t.result.call_id, content: t.result.output };
      }
    });
  }
}