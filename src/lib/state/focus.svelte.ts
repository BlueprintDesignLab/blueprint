interface Focus {
    node: string,
    agentRole: AgentRoles
}

export const focus: Focus = $state({
    node: "All",
    agentRole: "plan"
})

export const setAgentFocusMode = (newFocusRole: AgentRoles) => {
    focus.agentRole = newFocusRole;
}

export const setFocuNode = (newFocusMode: string) => {
    focus.node = newFocusMode;
}