
interface Focus {
    node: string,
    mode: "plan" | "architect" | "implement"
}

export const focus: Focus = $state({
    node: "",
    mode: "plan"
})