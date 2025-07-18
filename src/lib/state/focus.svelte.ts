import { tauriStore } from "./tauriStore"

type Modes = "plan" | "architect" | "develop";

interface Focus {
    node: string,
    mode: Modes
}

export const focus: Focus = $state({
    node: "All",
    mode: "plan"
})

// $effect(() => {
//     tauriStore.set("focus-node", focus.node);
//     tauriStore.set("focus-mode", focus.node);
// });

// (async () => {
//     focus.mode = await tauriStore.get("focus-node") as Modes ?? "All";
//     focus.mode = await tauriStore.get("focus-mode") ?? "plan";
// })();