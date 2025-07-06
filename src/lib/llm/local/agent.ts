import OpenAI from "openai";; // Your OpenAI API wrapper
import { invoke } from "@tauri-apps/api/core"; // For Tauri backend tool calls
import { PUBLIC_OPENAI } from "$env/static/public";

const openai = new OpenAI({
    apiKey: PUBLIC_OPENAI,
    dangerouslyAllowBrowser: true
});

const CHAT_HISTORY_LIMIT = 2;
const TOOL_HISTORY_LIMIT = 8;

// type ToolCall = { 
//     name: string, 
//     args: any, 
//     result: any, 
//     timestamp?: string 
// };

export class LLMGraphAgent {
  chatHistory: ChatTurn[] = [];
  toolHistory: any[] = [];
  systemPrompt: string;
  maxSteps = 20;
  edgeOrNodeId: string;
  nodeEdgeType: "node" | "edge";
  done = true;

  constructor(systemPrompt: string, nodeEdgeID: string, nodeEdgeType: "node" | "edge") {
    this.systemPrompt = systemPrompt;
    this.edgeOrNodeId = nodeEdgeID;
    this.nodeEdgeType = nodeEdgeType;
  }

  async run(userMessage: ChatTurn) {
    this.appendChat(userMessage);

    this.done = false;
    let step = 0;

    while (!this.done && step < this.maxSteps) {
      const prompt = this.buildPrompt();

      // Start streaming LLM response
      const stream = await openai.responses.create({
        model: "gpt-4.1",
        input: prompt,
        stream: true,
        tools: tools4,
        instructions: this.systemPrompt
      });

      let assistantContent = "";
      let toolCalls: any[] = [];

      for await (const event of stream) {
        if (event.type === "response.output_text.delta") {
          assistantContent += event.delta;
          // Optionally update UI here
        }
        if (event.type === "response.output_item.done") {
          toolCalls.push(event.item);
        }
      }

      this.appendChat({role: "assistant", content: assistantContent});
      // Persist chat turn to .blueprint history
    //   await this.persistHistory("chat", { role: "assistant", content: assistantContent });

      // Handle tool calls
      for (const toolCall of toolCalls) {
        const result = await this.executeTool(toolCall.name, toolCall.arguments);
        const resObj = {
          "type": "function_call_output",
          "call_id": toolCall.call_id,
          "output": result.toString()
        }
        this.appendToolCall(toolCall);
        // await this.persistHistory("tool", toolCall);

        this.appendToolCall(resObj);
        // await this.persistHistory("tool", resObj);
      }

      if (
        step >= this.maxSteps
      ) {
        this.done = true;
      }

      step++;
    }
  }

  buildPrompt(): string {
    let prompt = this.systemPrompt + "\n\n";
    for (const turn of this.chatHistory.slice(-CHAT_HISTORY_LIMIT)) {
      prompt += `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}\n`;
    }
    for (const call of this.toolHistory.slice(-TOOL_HISTORY_LIMIT)) {
      prompt += `Tool: ${call.name}(${JSON.stringify(call.args)}) → ${JSON.stringify(call.result)}\n`;
    }
    prompt += "\n(You may call tools to fetch more context as needed.)\n";
    return prompt;
  }

  appendChat(chatTurn: ChatTurn) {
    chatTurn.timestamp = new Date().toISOString();
    this.chatHistory.push(chatTurn);

    if (this.chatHistory.length > CHAT_HISTORY_LIMIT) {
      this.chatHistory = this.chatHistory.slice(-CHAT_HISTORY_LIMIT);
    }
  }

  appendToolCall(toolCall: any) {
    toolCall.timestamp = new Date().toISOString();

    this.toolHistory.push(toolCall);
    if (this.toolHistory.length > TOOL_HISTORY_LIMIT) {
      this.toolHistory = this.toolHistory.slice(-TOOL_HISTORY_LIMIT);
    }
  }

  async executeTool(name: string, args: any): Promise<any> {
    if (name === "end_agentic_loop") {
        this.done = true;
        return args;
    }

    // Use Tauri invoke or your backend to execute the tool
    return await invoke(name, args);
  }

  // async persistHistory(type: "chat" | "tool", entry: any) {
  //   const path = `.blueprint/${this.nodeEdgeType === "edge" ? "edges" : "nodes"}/${this.edgeOrNodeId}/${type}_history.json`;
  //   let history = [];
  //   try {
  //     history = JSON.parse(await invoke("read_file", { path })) || [];
  //   } catch {}
  //   history.push({ ...entry, timestamp: new Date().toISOString() });
  //   await invoke("write_file", { path, content: JSON.stringify(history, null, 2) });
  // }
}
