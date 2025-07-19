interface Focus {
    node: string,
    agentMode: AgentModes
}

export const focus: Focus = $state({
    node: "All",
    agentMode: "plan"
})

export const setFocusMode = (newFocusMode: AgentModes) => {
    focus.agentMode = newFocusMode;
}

export const setFocuNode = (newFocusMode: string) => {
    focus.node = newFocusMode;
}