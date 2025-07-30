import { historyStore } from "$lib/state/tauriStores";

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

export type NeutralTurn =
  | { kind: "user"; content: string }
  | { kind: "assistant"; content: string }
  | { kind: "toolCall"; call: ToolCall }
  | { kind: "toolResult"; result: ToolResult };

export class ChatHistory {
  turns: NeutralTurn[] = [];
  key: string = ""

  constructor(key: string) {
    this.key = key;
  }

  addUser(text: string)           { this.turns.push({ kind: "user", content: text }); }
  addAssistant(text: string)     { this.turns.push({ kind: "assistant", content: text ?? "" }); }
  addToolCall(call: ToolCall)     { this.turns.push({ kind: "toolCall", call }); }
  addToolResult(res: ToolResult)  { this.turns.push({ kind: "toolResult", result: res }); }

  clear() {
    this.turns = [];
    this.save();
  }

  save(): void {
    historyStore.set(this.key, this.turns);
  }

  async load() {
    this.turns = await historyStore.get(this.key) ?? [] as NeutralTurn[];
  }
}