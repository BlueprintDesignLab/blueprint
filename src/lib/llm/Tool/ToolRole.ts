export const TOOL = {
  writeProjectFile: "writeProjectFile",
  proposePlanMD:      "proposePlanMD",
  writeGraphYAML:   "writeGraphYAML",
  readFile:         "readFile",
  listDirTree:      "listDirTree",
  runCommand:       "runCommand",
  startNodeCoder:       "startNodeCoder",
  refer:            "refer",
  endSuccess:       "endAgenticLoopSuccess",
  endFailure:       "endAgenticLoopFailure",
  webSearch:        "webSearch",
} as const;

export type ToolKey = typeof TOOL[keyof typeof TOOL];

const roleTools: Record<AgentRoles, ToolKey[]> = {
  plan:   [TOOL.proposePlanMD, TOOL.readFile, TOOL.listDirTree, TOOL.refer, TOOL.endSuccess, TOOL.endFailure],
  architect: [TOOL.writeGraphYAML, TOOL.readFile, TOOL.listDirTree, TOOL.refer, TOOL.endSuccess, TOOL.endFailure],
  code:     [TOOL.writeProjectFile, TOOL.readFile, TOOL.listDirTree, TOOL.runCommand, TOOL.refer, TOOL.startNodeCoder, TOOL.endSuccess, TOOL.endFailure],
};

export function toolsFor(role: AgentRoles): ToolKey[] {
  return roleTools[role];
}
