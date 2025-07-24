<script lang="ts">
  import { agentRole } from "$lib/state/agentRole.svelte";

  import NewArchitectEditor from "./ArchitectEditor.svelte";
  import DevelopEditor from "./DevelopEditor.svelte";
  import PlanEditor from "./PlanEditor.svelte";
  import { loadPlanFile } from "$lib/util/planIO";
  import { fileWatcher } from "$lib/watcher/fileWatcher";
  import { editorState } from "$lib/state/editor.svelte";
  import { onMount } from "svelte";
  import { graphCode } from "$lib/state/graph.svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { saveGraphYaml, saveViewJson, type MergedGraph } from "$lib/util/graphIO";

  /* ---- file loaders ---- */
  async function loadGraphFiles() {
    
    let graphYaml = '';
    let viewJSON  = '';
    try { graphYaml = await invoke('read_file', { path: '.blueprint/graph.yaml' }); } catch {}
    try { viewJSON  = await invoke('read_file', { path: '.blueprint/view.json'  }); } catch {}

    graphCode.loadGraph(graphYaml, viewJSON);
  }

  let planUnlisten: (() => void) | null = null;

  onMount(() => {
    loadPlanFile().then((text) => {editorState.planMD = text;});
    loadGraphFiles();

    fileWatcher.addListener(e => {
      if (e.kind.includes('data') && e.paths.some(p => p.endsWith('/.blueprint/plan.md')))
        loadPlanFile().then(text => (editorState.planMD = text));
    }).then((unl) => planUnlisten = unl);

    return () => {planUnlisten?.(); };
  });

  $inspect(graphCode.nodes);

  // let run = 0;
  $effect(() => {
    console.log("saving graph");
    // if (++run > 5) {
    //   console.trace('loop detected');
    //   return;
    // }
    graphCode.nodes;
    graphCode.edges;

    const snap = $state.snapshot(graphCode.getGraph()) as MergedGraph;
    saveGraphYaml(snap);
    saveViewJson(snap);
  });
</script>


{#if agentRole.agentRole === "plan"}
    <PlanEditor />
{:else if agentRole.agentRole === "architect"}
    <NewArchitectEditor />
{:else if agentRole.agentRole === "code"}
    <DevelopEditor />
{/if}