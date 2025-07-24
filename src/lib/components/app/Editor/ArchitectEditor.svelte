<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";

  import { graphCode } from "$lib/state/graph.svelte";
  import { yaml } from "@codemirror/lang-yaml";

  import { saveGraphSemantic, saveGraphView } from "$lib/util/graphIO";

  import GraphDiff from "./Canvas/GraphDiff.svelte";
  import CodeDynam from "./Canvas/CodeDynam.svelte";

  let semDerived = $derived(saveGraphSemantic(graphCode.getSelectedGraph()));
  let viewDerived = $derived(saveGraphView(graphCode.getSelectedGraph()));

  function updateGraph() {
    try {
      graphCode.loadGraph(semDerived, viewDerived);
    } catch (e) {
      //suppress in-between invalid YAML states
    }
  }
</script>

<Resizable.PaneGroup direction="horizontal" autoSaveId="graphYamlEditor">
  <!-- {#if graphCode.filtering} -->
    <Resizable.Pane defaultSize={20}>
      <div class="h-screen">
          <CodeDynam
          bind:content={semDerived}
          lineWrapping={true}
          lang={yaml}
          onChange = {() => {updateGraph()}}
          />
      </div>
    </Resizable.Pane>
    <Resizable.Handle withHandle />
  <!-- {/if} -->

  <Resizable.Pane defaultSize={50}>
    <GraphDiff  />

  </Resizable.Pane>
</Resizable.PaneGroup>
