interface Focus {
    node: string,
    agentRole: AgentRoles
}

export const agentRole: Focus = $state({
    node: "Project Scaffolder",
    agentRole: "plan"
})

export const setAgentFocusMode = (newFocusRole: AgentRoles) => {
    agentRole.agentRole = newFocusRole;
}

export const setAgentFocusNode = (newFocusMode: string) => {
    agentRole.node = newFocusMode;
}