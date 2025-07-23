<script lang="ts">
  import { graphCode } from "$lib/state/graph.svelte";
  import { yaml } from "@codemirror/lang-yaml";

  import { saveGraphSemantic, saveGraphView } from "$lib/util/graphIO";

  import { invoke } from "@tauri-apps/api/core";

  import GraphDiff from "./Canvas/GraphDiff.svelte";
  import CodeSingle from "./Canvas/CodeSingle.svelte";
  import { debounce } from "$lib/util/debounce";

  let semDerived = $derived(saveGraphSemantic(graphCode.getSelectedGraph()));
  let viewDerived = $derived(saveGraphView(graphCode.getSelectedGraph()));

  function updateGraph() {
    try {
      // loadGraphDebounced();
      graphCode.loadGraph(semDerived, viewDerived);
      console.log(semDerived);
      saveGraphDebounced();
    } catch (e) {
      //suppress in-between invalid YAML states
    }
  }
  
  const saveGraphDebounced = debounce(() => {
    invoke('write_project_file', {
      path: "./.blueprint/graph.yaml",
      content: saveGraphSemantic(graphCode.getGraph()),
    });
  }, 200);

  const saveViewDebounced = debounce(() => {
    invoke('write_project_file', {
      path: "./.blueprint/view.json",
      content: saveGraphView(graphCode.getGraph()),
    });
  }, 200);

  $inspect(semDerived);

  $effect(() => {
    viewDerived;
    saveViewDebounced();
  })
</script>


<!-- FloatingCodeMirror.svelte -->
<div
  class="
    fixed top-4 left-4 z-50
    max-w-sm w-11/12 sm:w-96
    max-h-[calc(100vh-2rem)]
    overflow-hidden
    rounded-xl border border-slate-300 bg-white shadow-2xl
    {graphCode.filtering ? '' : 'hidden'}
  "
>
  <div class="overflow-y-auto max-h-full">
    <CodeSingle
      bind:content={semDerived}
      lineWrapping
      lang={yaml}
      onChange={() => updateGraph()}
    />
  </div>
</div>

<GraphDiff />