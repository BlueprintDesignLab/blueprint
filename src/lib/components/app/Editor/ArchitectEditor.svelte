<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";

  import { graphCode } from "$lib/state/graph.svelte";
  import { yaml } from "@codemirror/lang-yaml";

  import { saveGraphSemantic, saveGraphView } from "$lib/util/graphIO";

  import GraphDiff from "../Graph/GraphDiff.svelte";
  import CodeSingle from "./Code/CodeSingle.svelte";

  // let graphSemDerived = $derived(saveGraphSemantic(graphCode.getSelectedGraph()));
  // let semDerived = $derived(graphCode.previewStr ? graphCode.previewStr : graphSemDerived);

  // function patchGraph() {
  //   try {
  //     graphCode.applyPatch(semDerived);
  //   } catch (e) {
  //     //suppress in-between invalid YAML states
  //   }
  // }
</script>
          <!-- onChange = {() => {patchGraph()}} -->

<Resizable.PaneGroup direction="horizontal" autoSaveId="graphYamlEditor">
    <Resizable.Pane defaultSize={20}>

      <div class="h-screen">
        {#if graphCode.previewStr}

          <CodeSingle
          bind:content={graphCode.previewStr}
          lineWrapping={true}
          lang={yaml}
          readOnly={true}
          />
        {:else}
          <CodeSingle
          bind:content={graphCode.graphStr}
          lineWrapping={true}
          lang={yaml}
          />
        {/if}

      </div>
    </Resizable.Pane>
    <Resizable.Handle withHandle />

  <Resizable.Pane defaultSize={50}>
    <GraphDiff  />

  </Resizable.Pane>
</Resizable.PaneGroup>
