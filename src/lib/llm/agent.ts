import { invoke } from "@tauri-apps/api/core"; // For Tauri backend tool calls

import OpenAI from "openai";; // Your OpenAI API wrapper
import type { Tool } from "openai/resources/responses/responses.mjs";
import type { Stream } from "openai/streaming";

import { terminalController } from "$lib/state/terminal.svelte";
import { contextWindow, encoder } from "$lib/state/contextWindow.svelte";

import { tauriStore } from "$lib/state/tauriStore";
import { StreamParamExtractor } from "./streamParamExtractor";
import { graphCode } from "$lib/state/graph.svelte";


const CHAT_HISTORY_LIMIT = 99;
const TOOL_HISTORY_LIMIT = 99;

type Pending = {
  resolve: (val: string | null) => void;
  reject: (err: Error) => void;
};

export class Agent {
  chatHistory: ChatTurn[] = [];
  toolHistory: any[] = [];
  systemPrompt: string = "";
  tools: Tool[] = [];

  streamDelta: StreamDeltaFn;
  showTool: ShowToolFn;
  stopGenerating;
  updateMode;
  updateNode;

  updatePlan;
  updateGraph;
  updateCurrSrc;

  pendingApprovals = new Map<string, Pending>();
  activeToolCalls = new Map<string, StreamParamExtractor>();

  maxSteps = 20;
  done = true;

  constructor(
    chatHistory: ChatTurn[], 
    toolHistory: any[], 
    systemPrompt: string, 
    tools: Tool[],
    streamDelta: StreamDeltaFn,
    showTool: ShowToolFn,
    stopGenerating: () => void,

    updateMode: (arg0: AgentModes) => void,
    updateNode: (arg0: string) => void,
    updatePlan: (arg0: string) => void,
    updateGraph: (arg0: string) => void,
    updateCurrSrc: (arg0: string) => void,
  ) {
    this.chatHistory = chatHistory;
    this.toolHistory = toolHistory;
    this.systemPrompt = systemPrompt;
    this.tools = tools;

    this.streamDelta = streamDelta;
    this.showTool = showTool;
    this.stopGenerating = stopGenerating;

    this.updateMode = updateMode;
    this.updateNode = updateNode;

    this.updatePlan = updatePlan;
    this.updateGraph = updateGraph;
    this.updateCurrSrc = updateCurrSrc;
  }

  async run(userMessage: string, controller: AbortController) {
    this.appendChat(this.newChatTurn("user", userMessage));

    this.done = false;
    let step = 0;

    const openaiClient = new OpenAI({
      baseURL: await tauriStore.get('url-endpoint'),
      apiKey: await tauriStore.get('api-key'),
      dangerouslyAllowBrowser: true
    });

    const modelName: string = await tauriStore.get('model-name') ?? "gpt-4.1";

    while (!this.done && step < this.maxSteps) {
      const prompt = this.buildPrompt();
      contextWindow.length = encoder.encode(prompt + this.systemPrompt).length;  

      const stream = await openaiClient.responses.create({
        model: modelName,
        input: prompt,
        stream: true,
        tools: this.tools,
        instructions: this.systemPrompt,
        ...(modelName.startsWith("o3") ? {} : { temperature: 0 }),
      }, {
        signal: controller.signal,
      });

      const { assistantContent, toolCalls } = await this.processStream(stream);

      this.appendChat(this.newChatTurn("assistant", assistantContent));
      await this.handleLLMToolCalls(toolCalls);

      if (
        step >= this.maxSteps
        || toolCalls.length === 0
      ) {
        this.done = true;
      }

      step++;
    }

    this.stopGenerating();
  }

  async processStream(stream: Stream<OpenAI.Responses.ResponseStreamEvent>) {
    let assistantContent = "";
    let toolCalls: any[] = [];

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        assistantContent += event.delta;
        this.streamDelta(event.delta);
      } else if (event.type === "response.output_item.done") {
        if (event.item.type === "function_call") {
          toolCalls.push(event.item);
          this.activeToolCalls.delete(event.item.id ?? "");
        }
      } else if (event.type === "response.output_item.added") {
        if (event.item.type === "function_call") {
          this.showTool({id: event.item.id, tool: event.item});
          this.activeToolCalls.set(event.item.id ?? "", new StreamParamExtractor("content", event.item.name));
        }
      } else if (event.type === "response.function_call_arguments.delta") {
        const toolCallExtractor = this.activeToolCalls.get(event.item_id)!;
        toolCallExtractor.feed(event.delta);

        if (toolCallExtractor.getToolName() === "write_plan_md_file") {
          this.updatePlan(toolCallExtractor.getBuffer());
          continue;

        } else if (toolCallExtractor.getToolName() === "write_graph_yaml_file") {
          try {
            graphCode.loadGraph(toolCallExtractor.getBuffer(), "");
          } catch (e) {} // suppress intermediate states
          continue;

        } else if (toolCallExtractor.getToolName() === "write_project_file") {
          this.updateCurrSrc(toolCallExtractor.getBuffer());
          continue;
        }

        this.showTool({id: event.item_id, delta: event.delta});
      }
    }

    return { assistantContent, toolCalls };
  }

  /** Called from the UI when a button is clicked. */
  handleApproval(id: string, result: string | null) {
    const pending = this.pendingApprovals.get(id);
    if (!pending) return;
    pending.resolve(result);
    this.pendingApprovals.delete(id);
  }

  /** Ask the UI to render UI and return when the user responds. */
  async waitForUser(toolCall: any): Promise<string | null> {
    const id = crypto.randomUUID();
    const promise = new Promise<string | null>((resolve, reject) => {
      this.pendingApprovals.set(id, { resolve, reject });
    });

    // Tell the front-end to show the button.  UI must later call `handleApproval`.
    this.showTool({ id: crypto.randomUUID(), tool: toolCall, approvalId: id });
    return promise;           
  }

  async executeTool(name: string, args: any): Promise<any> {
    if (name === "end_agentic_loop_success" || name === "end_agentic_loop_failure") {
      this.done = true;
      return JSON.stringify(args);

    } else if (name === "run_command") {
      const command = `${args.command} ${args.args.join(" ")}`
      return terminalController.controller?.run(command);

    } else if (name === "refer") {
      const approved = await this.waitForUser({ name, args });   
      if (approved == null) return null;                         

      this.updateMode(args.role);
      return;
    } else if (name === "start_coder") {
      const approved = await this.waitForUser({ name, args });   
      if (approved == null) return null;                         

      this.updateMode("code");
      this.updateNode(args.node);
      return;
    } 
    
    if (name === "write_plan_md_file") {
      name = "write_project_file";
      args.path = "./.blueprint/plan.md";
    } else if (name === "write_graph_yaml_file") {
      name = "write_project_file";
      args.path = "./.blueprint/graph.yaml";
    }

    try {
      if (name.includes("write") || name.includes("run")) {
        const approved = await this.waitForUser({ name, args });   
        if (approved == null) return null;                         
      }

      const result = await invoke(name, args);
      return result;
    } catch (e) {
      // this.streamDelta(`Error: ${e}`);
      return e;
    }
  }

  async handleLLMToolCalls(toolCalls: any[]) {
    // Handle tool calls
    for (const toolCall of toolCalls) {
      const args = JSON.parse(toolCall.arguments);

      const result = await this.executeTool(toolCall.name, args) as string|null;

      // this.updateUI(`\n> Task Completed!`);
      const resObj = this.newToolCall({
        "type": "function_call_output",
        "call_id": toolCall.call_id,
        "output": result?.toString() ?? "success",
        "status": "resolved",
        "name": toolCall.name,
      });

      this.showTool({id: toolCall.id, tool: resObj});

      this.appendToolCall(toolCall);
      this.appendToolCall(resObj);
    }
  }

  buildPrompt(): string {
    // collect the recent history
    const combined = [
      ...this.chatHistory.slice(-CHAT_HISTORY_LIMIT),
      ...this.toolHistory.slice(-TOOL_HISTORY_LIMIT),
    ];

    // sort by ISO timestamp
    combined.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    // build the prompt
    let prompt = "";
    for (const item of combined) {
      if ("role" in item) {
        // chat turn
        prompt += `${item.role}: ${item.content}\n`;
      } else {
        // tool call or its output
        prompt += `Tool: ${JSON.stringify(item)}\n`;
      }
    }

    prompt +=
      'If you are completely done, call "end_agentic_loop_success"; ' +
      'if several attempts to fix does not work and you are blocked, call "end_agentic_loop_failure".\n';

    return prompt;
  }

  newChatTurn(role: ChatRole, content: string): ChatTurn {
    return {
      role,
      content,
      timestamp: new Date().toISOString(),
    }
  }

  newToolCall(toolCall: any): any {
    return {
      ...toolCall,
      timestamp: new Date().toISOString(),
    }
  }

  appendChat(chatTurn: ChatTurn) {
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

  private historyPath(type: "chat" | "tool") {
    return `.blueprint/${type}_history.json`;
  }

  async persistHistory(type: "chat" | "tool", entry: any) {
    const path = this.historyPath(type);
    let history: any[] = [];

    try {
      const raw = await invoke<string>("read_file", { path });
      history = JSON.parse(raw ?? "[]");
    } catch {}

    history.push({ ...entry, timestamp: new Date().toISOString() });

    await invoke("write_file", {
      path,
      content: JSON.stringify(history, null, 2),
    });
  }

  async loadHistory() {
    try {
      const chatRaw = await invoke<string>("read_file", {
        path: this.historyPath("chat"),
      });
      const chat = JSON.parse(chatRaw ?? "[]");
      this.chatHistory = chat.slice(-2);
    } catch {
      this.chatHistory = [];
    }

    try {
      const toolRaw = await invoke<string>("read_file", {
        path: this.historyPath("tool"),
      });
      const tools = JSON.parse(toolRaw ?? "[]");
      this.toolHistory = tools.slice(-5);
    } catch {
      this.toolHistory = [];
    }
  }
}
