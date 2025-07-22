interface Focus {
    node: string,
    agentRole: AgentRoles
}

export const focus: Focus = $state({
    node: "All",
    agentRole: "plan"
})

export const setFocusMode = (newFocusMode: AgentRoles) => {
    focus.agentRole = newFocusMode;
}

export const setFocuNode = (newFocusMode: string) => {
    focus.node = newFocusMode;
}