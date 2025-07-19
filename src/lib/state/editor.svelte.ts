export const editorState = $state({
    planMD: "",
    graphYAML: "",
    currSrc: "",

    proposedPlanMD: "",
    proposedGraphYaml: "",
    proposedCurrSrc: "",
});

export const updatePlan = (newPlan: string) => {
    // newPlan = JSON.parse(newPlan);
    editorState.planMD = newPlan;
}

export const updateCurrSrc = (newSrc: string) => {
    editorState.currSrc = newSrc;
}