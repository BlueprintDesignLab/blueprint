import { ChatHistory } from "./ChatHistory";
import { ToolRegistry } from "../Tool/ToolRegistry";
import { StreamHandler, type UIUpdaterCallbacks } from "../Stream/StreamHandler";
import { type ToolKey } from "../Tool/ToolRole";

import { getCurrLLMClient } from "./currLLMClient";

const MAX_STEPS = 9999999999999;

export class Agent {
  private history: ChatHistory;

  private registry: ToolRegistry;
  private streamHandler: StreamHandler;

  private done = true;
  private systemPrompt;

  private controller = new AbortController();
   
  constructor(
    history: ChatHistory,
    systemPrompt: string,
    tools: ToolKey[],
    callbacks: UIUpdaterCallbacks
  ) {
    this.systemPrompt = systemPrompt;

    this.streamHandler = new StreamHandler(callbacks);
    this.registry = new ToolRegistry(tools, this.streamHandler); 

    this.history = history;
  }

  async run(userMessage: string) {
    this.history.addUser(userMessage);
    this.done = false;
    let step = 0;

    while (!this.done && step++ < MAX_STEPS) {
      this.controller = new AbortController();

      const client = await getCurrLLMClient();
      if (!client) {
        console.error("Model not selected?");
        break;
      }

      const stream = client.createStream(this.history, this.registry.listToolSchemas(), this.systemPrompt, this.controller.signal)

      const { assistantContent, toolCalls } = await this.streamHandler.consume(stream);

      if (assistantContent) {
        this.history.addAssistant(assistantContent);
      }

      for (const tc of toolCalls) {
        this.history.addToolCall({...tc, arguments: tc.args});
        const argsObj = JSON.parse(tc.args);
        const output = await this.registry.execute(tc.name, argsObj);
        this.history.addToolResult({ call_id: tc.call_id, output });
        this.streamHandler.showToolCallResult(tc, tc.args, output);   
      }

      this.history.save();

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