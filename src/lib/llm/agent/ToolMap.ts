import { invoke } from "@tauri-apps/api/core";
import { terminalController } from "$lib/state/terminal.svelte";

import type { ToolKey } from "./ToolRole";
import type { ApprovalGateway } from "./StreamHandler";

import { clearProposedCurrSrc, clearProposedPlan, commitCurrSrc, commitPlan } from "$lib/state/editor.svelte";
import { graphCode } from "$lib/state/graph.svelte";

export interface ToolHandler {
  handler: (args: any, deps: { approval: ApprovalGateway }) => Promise<string>;
  schema:  BPTool;
}

export const toolMap: Record<ToolKey, ToolHandler> = {
  /* ---- write ---- */
  writeProjectFile: {
    schema: {
      type: "function",
      name: "write_project_file",
      description:
        "Create or replace a file anywhere under project root. Automatically makes missing parent directories and rejects paths that escape the sandbox.",
      parameters: {
        type: "object",
        properties: {
          path:    { type: "string", description: "File path relative to the /src directory" },
          content: { type: "string", description: "Full text content to write into the file." },
        },
        required: ["path", "content"],
        additionalProperties: false,
      },
      strict: true,
    },
    handler: async ({ path, content }, { approval }) => {
      const ok = await approval.ask({ name: "write_project_file", args: { path, content } });
      if (!ok) {
        clearProposedCurrSrc();
        return "not approved"
      };

      commitCurrSrc();
      return await invoke("write_project_file", { path, content }) ?? "success";
    },
  },

  writePlanMD: {
    schema: {
      type: "function",
      name: "write_plan_md_file",
      description: "Create or replace the plan.md file.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "Full text content to write into the file." },
        },
        required: ["content"],
        additionalProperties: false,
      },
      strict: true,
    },
    handler: async ({ content }, { approval }) => {
      const ok = await approval.ask({ name: "write_plan_md_file", args: { content } });
      if (!ok) {
        clearProposedPlan();
        return "not approved"
      };

      commitPlan();
      return "success";
    },
  },

  writeGraphYAML: {
    schema: {
      type: "function",
      name: "write_graph_yaml_file",
      description: "Create or replace the graph.yaml file.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "Full text content to write into the file." },
        },
        required: ["content"],
        additionalProperties: false,
      },
      strict: true,
    },
    handler: async ({ content }, { approval }) => {
      const ok = await approval.ask({ name: "write_graph_yaml_file", args: { content } });
      if (!ok) {
        graphCode.clearProposed();
        return "not approved"
      };

      graphCode.commitGraph();
      return "success";
    },
  },

  /* ---- read ---- */
  readFile: {
    schema: {
      type: "function",
      name: "read_file",
      description: "Read the contents of a text file.",
      parameters: {
        type: "object",
        properties: { path: { type: "string", description: "Relative path from the project root." } },
        required: ["path"],
        additionalProperties: false,
      },
      strict: true,
    },
    handler: async ({ path }, { approval }) => {
      // const ok = await approval.ask({ name: "read_file", args: { path } });
      return await invoke("read_file", { path }) ?? "failed";
    },
  },

  listDirTree: {
    schema: {
      type: "function",
      name: "list_directory_tree",
      description: "List full contents of a directory tree.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
        additionalProperties: false,
      },
      strict: true,
    },
    handler: async ({ path }, { approval }) => {
      // const ok = await approval.ask({ name: "list_directory_tree", args: { path } });
      return await invoke("list_directory_tree", { path }) ?? "failed";
    },
  },

  /* ---- system ---- */
  runCommand: {
    schema: {
      type: "function",
      name: "run_command",
      description: "Execute a shell command.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string" },
          args:    { type: "array", items: { type: "string" } },
        },
        required: ["command", "args"],
        additionalProperties: false,
      },
      strict: true,
    },
    handler: async ({ command, args }, { approval }) => {
      const full = `${command} ${args.join(" ")}`;
      const ok = await approval.ask({ name: "run_command", args: { command, args } });
      if (!ok) return "not approved";

      return await terminalController.controller!.run(full) ?? "failed";
    },
  },

  /* ---- meta / shared ---- */
  startCoder: {
    schema: {
      type: "function",
      name: "start_coder",
      description: "Refer the current chat to a coder which can implement a node inside graph.yaml.",
      parameters: {
        type: "object",
        properties: { node: { type: "string", description: "The focus node for the code to implement." } },
        required: ["node"],
        additionalProperties: false,
      },
      strict: true,
    },
    handler: async ({ node }, { approval }) => {
      const ok = await approval.ask({ name: "start_coder", args: { node } });
      return ok ? "coder started" : "not approved";
    },
  },

  refer: {
    schema: {
      type: "function",
      name: "refer",
      description: "Refer the user to another agent responsible for the task.",
      parameters: {
        type: "object",
        properties: { role: { type: "string", description: "The agent to refer to: 'plan' | 'architect' | 'code'." } },
        required: ["role"],
        additionalProperties: false,
      },
      strict: true,
    },
    handler: async ({ role }, { approval }) => {
      const ok = await approval.ask({ name: "refer", args: { role } });
      return ok ? "refer successful" : "not approved";
    },
  },

  endAgenticLoopSuccess: {
    schema: {
      type: "function",
      name: "end_agentic_loop_success",
      description: "Signal that the agentic loop has completed successfully.",
      parameters: {
        type: "object",
        properties: { reason: { type: "string", description: "A clear, human-readable reason for ending the loop." } },
        required: ["reason"],
        additionalProperties: false,
      },
      strict: true,
    },
    handler: async ({ reason }, { approval }) => {
      return JSON.stringify({ status: "success", reason });
    },
  },

  endAgenticLoopFailure: {
    schema: {
      type: "function",
      name: "end_agentic_loop_failure",
      description: "Signal that the agentic loop should end because an error occurred or the same tools have been called 5 times with no progress.",
      parameters: {
        type: "object",
        properties: { reason: { type: "string", description: "A clear, human-readable reason for ending the loop." } },
        required: ["reason"],
        additionalProperties: false,
      },
      strict: true,
    },
    handler: async ({ reason }, { approval }) => {
      return JSON.stringify({ status: "failure", reason });
    },
  },

  webSearch: {
    schema: { type: "web_search_preview" },
    handler: async () => "web search handled natively by provider",
  },
};
