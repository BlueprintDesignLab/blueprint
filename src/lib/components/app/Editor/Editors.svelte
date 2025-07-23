<script lang="ts">
  import { agentRole } from "$lib/state/agentRole.svelte";

  import NewArchitectEditor from "./NewArchitectEditor.svelte";
  import DevelopEditor from "./DevelopEditor.svelte";
  import PlanEditor from "./PlanEditor.svelte";
  import { loadPlanFile } from "$lib/util/planIO";
  import { fileWatcher } from "$lib/watcher/fileWatcher";
  import { editorState } from "$lib/state/editor.svelte";
  import { onMount } from "svelte";
  import { graphCode } from "$lib/state/graph.svelte";
  import { invoke } from "@tauri-apps/api/core";

  /* ---- file loaders ---- */
  async function loadGraphFiles() {
    let graphYaml = '';
    let viewJSON  = '';
    try { graphYaml = await invoke('read_file', { path: '.blueprint/graph.yaml' }); } catch {}
    try { viewJSON  = await invoke('read_file', { path: '.blueprint/view.json'  }); } catch {}

    graphCode.loadGraph(graphYaml, viewJSON);
  }


  let planUnlisten: (() => void) | null = null;
  let architectUnlisten: (() => void) | null = null;

  onMount(() => {
    loadPlanFile().then((text) => {editorState.planMD = text;});
    loadGraphFiles();

    fileWatcher.addListener(e => {
      if (e.kind.includes('data') && e.paths.some(p => p.endsWith('/.blueprint/plan.md')))
        loadPlanFile().then(text => (editorState.planMD = text));
    }).then((unl) => planUnlisten = unl);

    fileWatcher.addListener(e => {
        const { kind, paths } = e;
        const hasData = kind.includes("data");

        if (hasData) {
          for (const path of paths) {
            if (path.endsWith("/.blueprint/view.json")) {loadGraphFiles();};
            if (path.endsWith("/.blueprint/graph.yaml")) {loadGraphFiles();};
          }
        }        
    }).then((unl) => architectUnlisten = unl);

    return () => {planUnlisten?.(); architectUnlisten?.(); };
  });
</script>


{#if agentRole.agentRole === "plan"}
    <PlanEditor />
{:else if agentRole.agentRole === "architect"}
    <NewArchitectEditor />
{:else if agentRole.agentRole === "code"}
    <DevelopEditor />
{/if}