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
  import { schemaCompiledWatcher } from "$lib/watcher/schemaWatcher";
  import { compileSchemaPathAndWrite } from "$lib/util/schemaCompiler";

  /* ---- file loaders ---- */
  async function loadGraphFiles() {
    let graphYaml = '';
    let viewJSON  = '';
    try { graphYaml = await invoke('read_file', { path: '.blueprint/graph.yaml' }); } catch {}
    try { viewJSON  = await invoke('read_file', { path: '.blueprint/view.json'  }); } catch {}

    graphCode.setGraph(graphYaml, viewJSON);
  }

  let planUnlisten: (() => void) | null = null;
  let schemaUnlisten: (() => void) | null = null;

  onMount(() => {
    loadPlanFile().then((text) => {editorState.planMD = text;});
    loadGraphFiles();

    fileWatcher.addListener(e => {
      if (e.kind.includes('data') && e.paths.some(p => p.endsWith('/.blueprint/plan.md')))
        loadPlanFile().then(text => (editorState.planMD = text));
    }).then((unl) => planUnlisten = unl);

    fileWatcher.addListener(e => {
      if (e.kind.includes('data') 
          && e.paths.some(p => (p.endsWith('/.blueprint/graph.yaml') || p.endsWith('/.blueprint/view.json')))) {
        loadGraphFiles();
      }
    }).then((unl) => planUnlisten = unl);

    schemaCompiledWatcher.addListener(async (e) => {
      console.log(e.path);

      const schemaPath = e.path;
      const edgeWithSchema = graphCode.getGraph().edges.find((e) => {
        return e.data?.schema_file === schemaPath
      });

      if (!edgeWithSchema) return;
      console.log(edgeWithSchema);

      const stubPaths = edgeWithSchema?.data?.stub_files ?? {};

      for (const [key, val] of Object.entries(stubPaths)) {
        compileSchemaPathAndWrite(schemaPath, val);
      }     
    }).then((unl) => schemaUnlisten = unl);

    return () => {planUnlisten?.(); schemaUnlisten?.();};
  });

  $effect(() => {
    // console.log("saving graph");
    if (!graphCode.viewStr) {
      return;
    }

    saveViewJson(graphCode.viewStr);
    saveGraphYaml(graphCode.graphStr);
  });
</script>


{#if agentRole.agentRole === "plan"}
    <PlanEditor />
{:else if agentRole.agentRole === "architect"}
    <NewArchitectEditor />
{:else if agentRole.agentRole === "code"}
    <DevelopEditor />
{/if}