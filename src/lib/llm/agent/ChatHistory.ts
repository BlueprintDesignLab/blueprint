const CHAT_HISTORY_LIMIT = 99;
const TOOL_HISTORY_LIMIT = 99;

export class ChatHistory {
  chat: ChatTurn[] = [];
  tools: any[] = [];

  appendChat = (t: ChatTurn) => pushLimited(this.chat, t, CHAT_HISTORY_LIMIT);
  appendTool = (t: any) => pushLimited(this.tools, t, TOOL_HISTORY_LIMIT);

  buildPrompt(systemFallback: string) {
    const combined = [...this.chat, ...this.tools]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    let prompt = combined.map(i => "role" in i
        ? `${i.role}: ${i.content}`
        : `Tool: ${JSON.stringify(i)}`).join("\n");
    prompt += "\n" + systemFallback;
    return prompt;
  }

  async load() { /* read from disk */ }
  async persist() { /* write to disk */ }
}

function pushLimited<T>(arr: T[], item: T, limit: number) {
  arr.push(item);
  if (arr.length > limit) arr.splice(0, arr.length - limit);
}