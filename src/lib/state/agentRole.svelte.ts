interface Focus {
    node: string,
    agentRole: AgentRoles
}

export const agentRole: Focus = $state({
    node: "",
    agentRole: "plan"
})

export const setAgentFocusMode = (newFocusRole: AgentRoles) => {
    agentRole.agentRole = newFocusRole;
}

export const setFocuNode = (newFocusMode: string) => {
    agentRole.node = newFocusMode;
}