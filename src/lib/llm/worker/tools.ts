import { type Tool } from "openai/resources/responses/responses.mjs";
import { sharedTools } from "../sharedTools";
import { systemTools } from "../systemTools";
import { writeProjectFile } from "../writeTools";
import { readTools } from "../readTools";


// /**
//  * High-level cognitive tools for LLM agents.
//  * Focuses on planning, reflection, and task management.
//  */
// // Combined exports
export const workerTools: Tool[] = [
  writeProjectFile,
  ...readTools,
  ...systemTools,
  ...sharedTools,
];
