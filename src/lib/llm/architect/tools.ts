import { type Tool } from "openai/resources/responses/responses.mjs";
import { sharedTools } from "../sharedTools";
import { writeProjectFile } from "../writeTools";
import { readTools } from "../readTools";


// /**
//  * High-level cognitive tools for LLM agents.
//  * Focuses on planning, reflection, and task management.
//  */
// // Combined exports
export const architectTools: Tool[] = [
  writeProjectFile,
  ...readTools,
  ...sharedTools,
];
