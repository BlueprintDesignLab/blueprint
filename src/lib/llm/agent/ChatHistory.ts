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
}