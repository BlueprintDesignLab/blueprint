export const TOOL = {
  writeProjectFile: "writeProjectFile",
  writePlanMD:      "writePlanMD",
  writeGraphYAML:   "writeGraphYAML",
  readFile:         "readFile",
  listDirTree:      "listDirTree",
  runCommand:       "runCommand",
  startCoder:       "startCoder",
  refer:            "refer",
  endSuccess:       "endAgenticLoopSuccess",
  endFailure:       "endAgenticLoopFailure",
  webSearch:        "webSearch",
} as const;

export type ToolKey = typeof TOOL[keyof typeof TOOL];

const roleTools: Record<AgentRoles, ToolKey[]> = {
  plan:   [TOOL.writePlanMD, TOOL.readFile, TOOL.listDirTree, TOOL.refer, TOOL.endSuccess, TOOL.endFailure, TOOL.webSearch],
  architect: [TOOL.startCoder, TOOL.writeGraphYAML, TOOL.writeProjectFile, TOOL.readFile, TOOL.listDirTree, TOOL.refer, TOOL.endSuccess, TOOL.endFailure, TOOL.webSearch],
  code:     [TOOL.writeProjectFile, TOOL.readFile, TOOL.listDirTree, TOOL.runCommand, TOOL.refer, TOOL.endSuccess, TOOL.endFailure, TOOL.webSearch],
};

export function toolsFor(role: AgentRoles): ToolKey[] {
  return roleTools[role];
}
