<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs/index.js";

  import CodeMirror from "svelte-codemirror-editor";

  import { yaml } from "@codemirror/lang-yaml";
  import { tomorrow } from "thememirror";

  import { saveGraphSemantic, saveGraphView } from "$lib/util/graphIO";
  import { graphCode } from "$lib/state/graph.svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { onMount } from "svelte";

  let semDerived = $derived(saveGraphSemantic(graphCode.getSelectedGraph()));
  let viewDerived = $derived(saveGraphView(graphCode.getSelectedGraph()));

  import { watch, type UnwatchFn, BaseDirectory } from '@tauri-apps/plugin-fs';
    import { watchImmediate } from "@tauri-apps/plugin-fs";


  // $inspect(semDerived);
  // $inspect(graphCode.filtering);

  let unwatch: UnwatchFn | undefined;

  onMount(async () => {
    // await watch(
    //   "/Users/yao/blueprint/blueprint/testPokemon/.blueprint/graph.yaml",
    //   (event) => {
    //     console.log(event);
    //   },
    //   { recursive: false, delayMs: 300 }   // no baseDir when you pass an absolute path
    // );

    // // watch() starts after delayMs, watchImmediate() emits the first snapshot immediately
    // unwatch = await watch(
    //   'blueprint/blueprint/testPokemon/.blueprint/graph.yaml',                              // or absolute path
    //   (event) => {
    //     console.log(event);
    //     // event.kind: 'modify' | 'create' | 'remove' | …
    //     // event.paths: affected path(s)
    //     // if (event.kind === 'modify') {
    //     //   // pull fresh content or just reload store
    //     // }
    //   },
    //   { baseDir: BaseDirectory.Home, recursive: false, delayMs: 300 }
    // );

    let graphYaml = "";
    let viewJSON = "";

    try {
      graphYaml = await invoke("read_file", {
        path: ".blueprint/graph.yaml"
      })
    } catch (e) {}

    try {
      viewJSON = await invoke("read_file", {
        path: ".blueprint/view.json"
      })
    } catch (e) {}
    
    graphCode.loadGraph(graphYaml, viewJSON);
  });

  $effect(() => {
    viewDerived;
    saveViewDebounced();
  })

  function updateGraph() {
    try {
      loadGraphDebounced();
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

  const loadGraphDebounced = debounce(() => {
    graphCode.loadGraph(semDerived, viewDerived)
  }, 2000);

  const saveGraphDebounced = debounce(() => {
    invoke('write_blueprint_file', {
      path: "graph.yaml",
      content: saveGraphSemantic(graphCode.getGraph()),
    });
  }, 2000);

  const saveViewDebounced = debounce(() => {
    invoke('write_blueprint_file', {
      path: "view.json",
      content: saveGraphView(graphCode.getGraph()),
    });
  }, 50);

  // call this function multiple times, and it will debounce properly
  function saveGraphToFile() {
    saveGraphDebounced();
  }
</script>

<!-- ——— Tabs -------------------------------------------------------- -->
<Tabs.Root value="graphVal" class="flex flex-col h-screen w-full">
  <Tabs.List
    class="w-full flex items-center gap-2
         flex-nowrap
         border-b border-slate-200 px-3"
  >
    <Tabs.Trigger value="graphVal">Graph</Tabs.Trigger>
    <!-- <Tabs.Trigger value="viewVal">View</Tabs.Trigger> -->

  </Tabs.List>
  <!-- {semDerived} -->
  <!-- YAML editor pane -->
  <Tabs.Content value="graphVal" class="flex-1 overflow-auto">
    <div class="editor-shell">
      <CodeMirror
        bind:value={semDerived}
        lineWrapping={true}
        lang={yaml()}
        theme={tomorrow}
        on:change={() => updateGraph()}
      />
    </div>
  </Tabs.Content>
</Tabs.Root>

<style>
  /* Now the shell just fills its flex-parent */
  .editor-shell {
    height: 100%; /* full height of Tabs.Content */
    width: 100%;
    /* overflow: auto; */
    box-sizing: border-box;
  }
</style>