interface Focus {
    node: string,
    agentMode: AgentRoles
}

export const focus: Focus = $state({
    node: "All",
    agentMode: "plan"
})

export const setFocusMode = (newFocusMode: AgentRoles) => {
    focus.agentMode = newFocusMode;
}

export const setFocuNode = (newFocusMode: string) => {
    focus.node = newFocusMode;
}