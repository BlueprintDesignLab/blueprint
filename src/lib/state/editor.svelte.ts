export const editorState = $state({
  planMD: "",
  currSrc: "",
  currSrcPath: "",

  proposedPlanMD: "",
  proposedCurrSrc: "",
});

// ---------------------------------------------
// Plan helpers
// ---------------------------------------------
export const proposePlan       = (md: string) => (editorState.proposedPlanMD = md);
export const commitPlan        = () => {
  editorState.planMD = editorState.proposedPlanMD;
  editorState.proposedPlanMD = "";
  console.log(editorState.planMD)
};
export const clearProposedPlan = () => (editorState.proposedPlanMD = "");

// ---------------------------------------------
// Curr-src helpers
// ---------------------------------------------
export const proposeCurrSrc       = (src: string) => (editorState.proposedCurrSrc = src);
export const commitCurrSrc        = () => {
  editorState.currSrc = editorState.proposedCurrSrc;
  editorState.proposedCurrSrc = "";
};
export const clearProposedCurrSrc = () => (editorState.proposedCurrSrc = "");