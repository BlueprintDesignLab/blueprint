import type { Tool } from "openai/resources/responses/responses.mjs";

interface ToolHandler {
  name: string;
  schema: Tool;
  handler: (args: any, deps: { approval: ApprovalGateway }) => Promise<any>;
}

export class ToolRegistry {
  private handlers = new Map<string, ToolHandler>();

  constructor(private approval: ApprovalGateway) {}

  register(h: ToolHandler) { this.handlers.set(h.name, h); }

  async execute({ name, arguments: rawArgs }: any) {
    const h = this.handlers.get(name);
    if (!h) throw new Error(`Unknown tool ${name}`);
    const args = JSON.parse(rawArgs);
    return h.handler(args, { approval: this.approval });
  }

  asOpenAITools(): Tool[] {
    return [...this.handlers.values()].map(h => h.schema);
  }
}