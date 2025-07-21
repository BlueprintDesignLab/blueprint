<script lang="ts">

  import { graphCode } from "$lib/state/graph.svelte";
  import { focus } from "$lib/state/focus.svelte";
  import { editorState } from "$lib/state/editor.svelte";

  import CodeMirror from "svelte-codemirror-editor";

  import { yaml } from "@codemirror/lang-yaml";
  import { markdown } from "@codemirror/lang-markdown";
  import { tomorrow } from "thememirror";

  import { saveGraphSemantic, saveGraphView } from "$lib/util/graphIO";

  import { invoke } from "@tauri-apps/api/core";
  import { listen }   from "@tauri-apps/api/event";

  import { onMount } from "svelte";

  type FsEvent = {
      kind: string;
      paths: string[];
  };

  let unlisten = () => {};

  const startListener = async () => {
    await invoke("start_watcher");

    unlisten = await listen<FsEvent>("fs-event", ({ payload }) => {
        console.log(payload);
        const { kind, paths } = payload;

        // decide what to show
        const hasData    = kind.includes("data");

        if (hasData) {
          for (const path of paths) {
            if (path.endsWith("/.blueprint/plan.md")) {loadPlanFile();};
            if (path.endsWith("/.blueprint/view.json")) {loadGraphFiles();};
            if (path.endsWith("/.blueprint/graph.yaml")) {loadGraphFiles();};
          }
        }        

    });

    return unlisten;
  }

  /* ---- file loaders ---- */
  async function loadGraphFiles() {
    let graphYaml = '';
    let viewJSON  = '';
    try { graphYaml = await invoke('read_file', { path: '.blueprint/graph.yaml' }); } catch {}
    try { viewJSON  = await invoke('read_file', { path: '.blueprint/view.json'  }); } catch {}

    graphCode.loadGraph(graphYaml, viewJSON);
  }

  async function loadPlanFile() {
    try { editorState.planMD = await invoke('read_file', { path: '.blueprint/plan.md' }); } catch {}
  }

  let semDerived = $derived(saveGraphSemantic(graphCode.getSelectedGraph()));
  let viewDerived = $derived(saveGraphView(graphCode.getSelectedGraph()));

  onMount(() => {
    loadGraphFiles();
    loadPlanFile();
    startListener();

    return () => {
      unlisten();
    }
  });

  $effect(() => {
    viewDerived;
    saveViewDebounced();
  })

  function updateGraph() {
    try {
      // loadGraphDebounced();
      graphCode.loadGraph(semDerived, viewDerived);
      saveGraphToFile();
    } catch (e) {
      //suppress in-between invalid YAML states
    }
  }

  function debounce<T extends (...args: any[]) => void>(callback: T, wait: number): (...args: Parameters<T>) => void {
    let timeoutId: number | undefined;
    return (...args: Parameters<T>) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {callback(...args)}, wait);
    };
  }

  const saveGraphDebounced = debounce(() => {
    invoke('write_project_file', {
      path: "./.blueprint/graph.yaml",
      content: saveGraphSemantic(graphCode.getGraph()),
    });
  }, 1000);

  const saveViewDebounced = debounce(() => {
    invoke('write_project_file', {
      path: "./.blueprint/view.json",
      content: saveGraphView(graphCode.getGraph()),
    });
  }, 1000);

  const savePlanDebounced = debounce(() => {
    invoke('write_project_file', {
      path: "./.blueprint/plan.md",
      content: editorState.planMD,
    });
  }, 1000);

  // call this function multiple times, and it will debounce properly
  function saveGraphToFile() {
    saveGraphDebounced();
  }
</script>

{#if focus.agentMode === "plan"}
 <div class="editor-shell">
    <CodeMirror
      bind:value={editorState.planMD}
      lineWrapping={true}
      lang={markdown()}
      on:change={savePlanDebounced}
    />
  </div>
{:else if focus.agentMode === "architect"}
  <div class="editor-shell">
    <CodeMirror
      bind:value={semDerived}
      lineWrapping={true}
      lang={yaml()}
      theme={tomorrow}
      on:change={() => updateGraph()}
    />
  </div>
{:else if focus.agentMode === "code"}
  <div class="editor-shell">
    <CodeMirror
      bind:value={editorState.currSrc}
      lineWrapping={true}
    />
  </div>
{/if}

<style>
  /* Now the shell just fills its flex-parent */
  .editor-shell {
    height: 100%; /* full height of Tabs.Content */
    width: 100%;
    /* overflow: auto; */
    box-sizing: border-box;
  }
</style>