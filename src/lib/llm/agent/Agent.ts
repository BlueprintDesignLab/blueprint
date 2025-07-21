import { tauriStore } from "$lib/state/tauriStore";
import OpenAI from "openai";
import { ChatHistory } from "./ChatHistory";
import { OpenAIAdapter } from "./LLMClient";
import { ToolRegistry } from "./ToolRegistry";
import { UIUpdater, type UIUpdaterCallbacks } from "./UIUpdater";
import { toolsFor } from "./ToolRole";
import { getSystemPromptFor } from "./SystemPrompts";

const MAX_STEPS = 20;

export class Agent {
  private history = new ChatHistory();
  private registry: ToolRegistry;
  private ui: UIUpdater;

  private done = true;
  private systemPrompt;

  constructor(
    deps: { chat: ChatTurn[], tools: any[] },
    role: AgentRoles,
    callbacks: UIUpdaterCallbacks
  ) {
    this.history.chat = deps.chat;
    this.history.tools = deps.tools;
    this.systemPrompt = getSystemPromptFor(role);

    this.ui = new UIUpdater(callbacks);

    const tools = toolsFor("architect");
    this.registry = new ToolRegistry(tools, this.ui); 
  }

  async run(userMessage: string, controller: AbortController) {
    this.history.appendChat({ role: "user", content: userMessage });
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
      this.history.appendChat({ role: "assistant", content: assistantContent });

      for (const tc of toolCalls) {
        this.ui.showToolCalling(tc);
        const output = await this.registry.execute(tc.name, tc.args);
        this.history.appendTool({ type: "function_call_output", call_id: tc.call_id, output });
        this.ui.showToolCallResult(tc, output);        
      }

      if (toolCalls.length === 0) this.done = true;
    }

    this.ui.stop();
  }

  handleApproval(id: string, result: string | null) {
    this.ui.handleApproval(id, result);
  }
}