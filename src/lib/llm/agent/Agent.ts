import { tauriStore } from "$lib/state/tauriStore";

import { ChatHistory } from "./ChatHistory";
import { OpenAIAdapter, OpenAICompletionsAdapter } from "./LLMClient";
import { ToolRegistry } from "../Tool/ToolRegistry";
import { StreamHandler, type UIUpdaterCallbacks } from "../Stream/StreamHandler";
import { type ToolKey } from "../Tool/ToolRole";

import OpenAI from "openai";
import { OpenAICompletionsLLMClient } from "./OpenaiCompletionLLMClient";
import { OpenAIResponsesLLMClient } from "./OpenaiResponsesLLMClient";

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
    this.systemPrompt = systemPrompt;

    this.streamHandler = new StreamHandler(this.history, callbacks);
    this.registry = new ToolRegistry(tools, this.streamHandler); 
  }

  async run(userMessage: string) {
    this.history.addUser(userMessage);
    this.done = false;
    let step = 0;

    while (!this.done && step++ < MAX_STEPS) {
      const openai = new OpenAI({
        baseURL: await tauriStore.get('url-endpoint'),
        apiKey: await tauriStore.get('api-key'),
        dangerouslyAllowBrowser: true
      });
    
      const model: string = await tauriStore.get('model-name') ?? "gpt-4.1";

      this.controller = new AbortController();

      // const client = new OpenAICompletionsLLMClient(openai, model);
      // const stream = client.createStream(this.history, this.registry.listToolSchemas(), this.systemPrompt, this.controller.signal)

      const client = new OpenAIResponsesLLMClient(openai, model);
      const stream = client.createStream(this.history, this.registry.listToolSchemas(), this.systemPrompt, this.controller.signal)

      const { assistantContent, toolCalls } = await this.streamHandler.consume(stream);

      if (assistantContent) {
        this.history.addAssistant(assistantContent);
      }

      for (const tc of toolCalls) {
        const argsObj = JSON.parse(tc.args);
        const output = await this.registry.execute(tc.name, argsObj);
        this.history.addToolResult({ call_id: tc.call_id, output });
        this.streamHandler.showToolCallResult(tc, tc.args, output);        
      }

      if (toolCalls.length === 0) this.done = true;
    }

    console.log("here");
    this.streamHandler.stop();
  }

  handleApproval(id: string, result: string | null) {
    this.streamHandler.handleApproval(id, result);
  }

  abort() {
    this.controller.abort();
  }
}