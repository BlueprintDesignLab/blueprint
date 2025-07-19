export const editorState = $state({
    planMD: "",
    graphYAML: "",
    currSrc: "",

    proposedPlanMD: "",
    proposedGraphYaml: "",
    proposedCurrSrc: "",
});

export const proposePlan = (newPlan: string) => {
    editorState.proposedPlanMD = newPlan;
}

export const proposeCurrSrc = (newSrc: string) => {
    editorState.proposedCurrSrc = newSrc;
}

export const commit = () => {
    editorState.planMD = editorState.proposedPlanMD;
    editorState.graphYAML = editorState.proposedGraphYaml;
    editorState.currSrc = editorState.proposedCurrSrc;
}

export const revert = () => {
    editorState.proposedPlanMD = editorState.planMD;
    editorState.proposedGraphYaml = editorState.graphYAML;
    editorState.proposedCurrSrc = editorState.currSrc;
}