import type { Tool } from "openai/resources/responses/responses.mjs";

import type { ToolKey } from "./ToolRole";
import { toolMap } from "./ToolMap";
import type { ApprovalGateway } from "../Stream/StreamHandler";

interface InternalToolHandler {
  handler: (args: any) => Promise<string>;
  schema:  BPTool;
}


export class ToolRegistry {
  private handlers = new Map<string, InternalToolHandler>();

  constructor(keys: ToolKey[], approval: ApprovalGateway) {
    for (const k of keys) {
      const { schema, handler } = toolMap[k];
      this.handlers.set(schema.name, { schema, handler: (args) => handler(args, { approval }) });
    }
  }

  listToolSchemas(): Tool[] {
    return [...this.handlers.values()].map(h => h.schema);
  }

  async execute(name: string, args: any) {
    // // console.log(args);
    // // console.log(this.handlers.get(name)?.handler)
    return this.handlers.get(name)!.handler(args);
  }
}
