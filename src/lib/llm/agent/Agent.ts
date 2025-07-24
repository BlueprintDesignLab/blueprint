import { tauriStore } from "$lib/state/tauriStore";
import { ChatHistory } from "./ChatHistory";
import { OpenAIAdapter } from "./LLMClient";
import { ToolRegistry } from "./ToolRegistry";
import { StreamHandler, type UIUpdaterCallbacks } from "./StreamHandler";
import { type ToolKey } from "./ToolRole";

import OpenAI from "openai";

const MAX_STEPS = 20;

export class Agent {
  private history = new ChatHistory();
  private registry: ToolRegistry;
  private streamHandler: StreamHandler;

  private done = true;
  private systemPrompt;

  private controller = new AbortController();
   
  constructor(
    deps: { chat: ChatTurn[] },
    systemPrompt: string,
    tools: ToolKey[],
    callbacks: UIUpdaterCallbacks
  ) {
    this.history.chat = deps.chat;
    this.systemPrompt = systemPrompt;

    this.streamHandler = new StreamHandler(this.history, callbacks);
    this.registry = new ToolRegistry(tools, this.streamHandler); 
  }

  async run(userMessage: string) {
    this.history.appendChat({ role: "user", content: userMessage });
    this.done = false;
    let step = 0;

    while (!this.done && step++ < MAX_STEPS) {
      const prompt = this.history.buildOpenaiPrompt();
      // console.log(prompt);

      const openai = new OpenAI({
        baseURL: await tauriStore.get('url-endpoint'),
        apiKey: await tauriStore.get('api-key'),
        dangerouslyAllowBrowser: true
      });
    
      const model: string = await tauriStore.get('model-name') ?? "gpt-4.1";
      const tools = this.registry.asOpenAITools()
      // console.log(tools);
      // console.log(this.systemPrompt);
      this.controller = new AbortController();
      const adapter = new OpenAIAdapter(openai, model, prompt, tools, this.systemPrompt, this.controller.signal);

      const { assistantContent, toolCalls } = await this.streamHandler.consume(adapter);
      // console.log(toolCalls);
      this.history.appendChat({ role: "assistant", content: assistantContent });

      for (const tc of toolCalls) {
        const argsObj = JSON.parse(tc.args);
        const output = await this.registry.execute(tc.name, argsObj);
        this.history.appendTool({ type: "function_call_output", call_id: tc.call_id, output });
        this.streamHandler.showToolCallResult(tc, tc.args, output);        
      }

      if (toolCalls.length === 0) this.done = true;
    }

    this.streamHandler.stop();
  }

  handleApproval(id: string, result: string | null) {
    this.streamHandler.handleApproval(id, result);
  }

  abort() {
    this.controller.abort();
  }
}