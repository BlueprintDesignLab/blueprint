interface Focus {
    node: string,
    agentRole: AgentRoles
}

export const agentRole: Focus = $state({
    node: "All Edges",
    agentRole: "plan"
})

export const setAgentFocusMode = (newFocusRole: AgentRoles) => {
    agentRole.agentRole = newFocusRole;
}

export const setAgentFocusNode = (newFocusMode: string) => {
    agentRole.node = newFocusMode;
}