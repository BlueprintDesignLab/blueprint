import OpenAI from "openai";; // Your OpenAI API wrapper
import { invoke } from "@tauri-apps/api/core"; // For Tauri backend tool calls
import { PUBLIC_OPENAI } from "$env/static/public";

// import { graphAgentTools } from "./tools";
import { sharedTools } from "./sharedTools";

const CHAT_HISTORY_LIMIT = 99999;
const TOOL_HISTORY_LIMIT = 99999;

export class GlobalAgent {
  chatHistory: ChatTurn[] = [];
  toolHistory: any[] = [];
  systemPrompt: string = "test";

  updateUI;

  openai;

  maxSteps = 20;
  done = true;

  constructor(chatHistory: ChatTurn[], toolHistory: any[], updateUI: (delta: string) => void) {
    this.chatHistory = chatHistory;
    this.toolHistory = toolHistory;

    this.updateUI = updateUI;

    this.openai = new OpenAI({
      apiKey: PUBLIC_OPENAI,
      dangerouslyAllowBrowser: true
    });
  }

  async run(userMessage: ChatTurn) {
    this.appendChat(userMessage);

    this.done = false;
    let step = 0;

    while (!this.done && step < this.maxSteps) {
      const prompt = this.buildPrompt();
      console.log(prompt);
      const controller = new AbortController();

      // Start streaming LLM response
      const stream = await this.openai.responses.create({
        model: "gpt-4.1",
        input: prompt,
        stream: true,
        tools: sharedTools,
        instructions: this.systemPrompt,
      }, {
        signal: controller.signal,
      });

      let assistantContent = "";
      let toolCalls: any[] = [];

      for await (const event of stream) {
        if (event.type === "response.output_text.delta") {
          assistantContent += event.delta;
          this.updateUI(event.delta);
        } else if (event.type === "response.output_item.done") {
          if (event.item.type === "function_call") {
            toolCalls.push(event.item);
          }
        } else if (event.type === "response.output_item.added") {
          if (event.item.type === "function_call") {
            this.updateUI(`\n> Preparing to use: ${event.item.name}`);
          }
        }
      }

      this.appendChat({role: "assistant", content: assistantContent});
      // Persist chat turn to .blueprint history
    //   await this.persistHistory("chat", { role: "assistant", content: assistantContent });

      console.log(toolCalls);

      // Handle tool calls
      for (const toolCall of toolCalls) {
        const args = JSON.parse(toolCall.arguments);
        this.updateUI(`\n> Using Tool: ${toolCall.name}: ${toolCall.arguments}\n`);

        const result = await this.executeTool(toolCall.name, args);
        const resObj = {
          "type": "function_call_output",
          "call_id": toolCall.call_id,
          "output": result.toString()
        }

        this.appendToolCall(toolCall);
        this.appendToolCall(resObj);
        // await this.persistHistory("tool", { name: toolCall.name, args: toolCall.arguments, result });
      }

      if (
        step >= this.maxSteps
        || toolCalls.length === 0
      ) {
        this.done = true;
      }

      step++;
    }
  }

  buildPrompt(): string {
    let prompt = this.systemPrompt + "\n\n";
    for (const turn of this.chatHistory.slice(-CHAT_HISTORY_LIMIT)) {
      prompt += `${turn.role}: ${turn.content}\n`;
    }
    for (const call of this.toolHistory.slice(-TOOL_HISTORY_LIMIT)) {
      prompt += `Tool: ${JSON.stringify(call)}\n`;
    }
    prompt += "\nIf you are completely done, call \"end_agentic_loop_success\"; if blocked, call \"end_agentic_loop_failure\"\n";
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
    if (name === "end_agentic_loop_success") {
      this.done = true;
      const reason = args.reason;
      this.updateUI(`\n> Task Completed! ${reason}`);
      return args;
    } else if (name === "end_agentic_loop_failure") {
      this.done = true;
      const reason = args.reason;
      this.updateUI(`\n> Task blocked. ${reason}`);
      return args;
    }

    try {
      return await invoke(name, args);
    } catch (e) {
      this.updateUI(`Error: ${e}`);
      return e;
    }
  }

//   async persistHistory(type: "chat" | "tool", entry: any) {
//     const path = `.blueprint/${this.focusType === "edge" ? "edges" : "nodes"}/${this.edgeOrNodeId}/history.json`;
//     let history = [];
//     try {
//       history = JSON.parse(await invoke("read_file", { path })) || [];
//     } catch {}
//     history.push({ ...entry, timestamp: new Date().toISOString() });
//     await invoke("write_file", { path, content: JSON.stringify(history, null, 2) });
//   }
}
