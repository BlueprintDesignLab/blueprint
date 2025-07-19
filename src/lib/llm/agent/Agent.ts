import { tauriStore } from "$lib/state/tauriStore";
import OpenAI from "openai";
import { ChatHistory } from "./ChatHistory";
import { OpenAIAdapter, OpenaiLLMClient } from "./LLMClient";
import { ToolRegistry } from "./ToolRegistry";
import { UIUpdater } from "./UIUpdater";

const MAX_STEPS = 20;

export class Agent {
  private history = new ChatHistory();
  private registry: ToolRegistry;
  private ui: UIUpdater;

  private done = true;
  private systemPrompt;

  constructor(
    deps: { chat: ChatTurn[], tools: any[] },
    systemPrompt: string,
    callbacks: /* same long list as before */
  ) {
    this.history.chat = deps.chat;
    this.history.tools = deps.tools;
    this.systemPrompt = systemPrompt;

    this.ui = new UIUpdater(callbacks);
    this.registry = new ToolRegistry(this.ui);   // UIUpdater implements ApprovalGateway

    registerBuiltinTools(this.registry);         // helper that adds all your tools
  }

  async run(userMessage: string, controller: AbortController) {
    this.history.appendChat({ role: "user", content: userMessage, timestamp: new Date().toISOString() });
    this.done = false;
    let step = 0;

    while (!this.done && step++ < MAX_STEPS) {
      const prompt = this.history.buildPrompt(this.systemPrompt);

      const openai = new OpenAI({
        baseURL: await tauriStore.get('url-endpoint'),
        apiKey: await tauriStore.get('api-key'),
        dangerouslyAllowBrowser: true
      });
    
      const model: string = await tauriStore.get('model-name') ?? "gpt-4.1";
      const adapter = new OpenAIAdapter(openai, model, prompt, this.registry.asOpenAITools(), this.systemPrompt, controller.signal);

      const { assistantContent, toolCalls } = await this.ui.consume(adapter);
      this.history.appendChat({ role: "assistant", content: assistantContent, timestamp: new Date().toISOString() });

      for (const tc of toolCalls) {
        const output = await this.registry.execute(tc);
        this.history.appendTool({ type: "function_call_output", call_id: tc.call_id, output });
      }

      if (toolCalls.length === 0) this.done = true;
    }
  }
}