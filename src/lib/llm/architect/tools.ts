import { type Tool } from "openai/resources/responses/responses.mjs";
import { sharedTools } from "../sharedTools";
import { writeGraphYAMLFile, writeProjectFile } from "../writeTools";
import { readTools } from "../readTools";


const startWorker: Tool = {
  type: "function",
  name: "start_coder",
  description:
    "Refer the current chat to a coder which can implement a node inside graph.yaml. ",
  parameters: {
    type: "object",
    properties: {
      node: {
        type: "string",
        description:
          "The focus node for the code to implement."
      }
    },
    required: ["node"],
    additionalProperties: false
  },
  strict: true
};


export const architectTools: Tool[] = [
  startWorker,
  writeGraphYAMLFile,
  writeProjectFile,
  ...readTools,
  ...sharedTools,
];
