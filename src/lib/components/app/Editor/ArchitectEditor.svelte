<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";

  import CodeDiff from './Canvas/CodeDiff.svelte';
  import { yaml } from '@codemirror/lang-yaml';

  import { graphCode } from '$lib/state/graph.svelte';

  import { saveGraphSemantic, saveGraphView, saveGraphYaml, saveViewJson } from '$lib/util/graphIO';

  import GraphDiff from './Canvas/GraphDiff.svelte';
  import { untrack } from "svelte";
  
  let semDerived = $derived(saveGraphSemantic(graphCode.getSelectedGraph()));
  let viewDerived = $derived(saveGraphView(graphCode.getSelectedGraph()));

  // $effect(() => {
  //   semDerived;
  //   // viewDerived;
  //   // graphCode.loadGraph(semDerived, viewDerived);
  //   saveGraphYaml(untrack(() => graphCode.getGraph()));
  //   saveViewJson(untrack(() => graphCode.getGraph()));
  // });
</script>

<Resizable.PaneGroup direction="horizontal" autoSaveId="graphYamlEditor">
  {#if graphCode.filtering}
    <Resizable.Pane defaultSize={50}>
      <div class="editor-shell">
          <CodeDiff
          bind:content={semDerived}
          lineWrapping={true}
          lang={yaml}

          />
      </div>
    </Resizable.Pane>
    <Resizable.Handle withHandle />
  {/if}

  <Resizable.Pane defaultSize={50}>
    <GraphDiff  />

  </Resizable.Pane>
</Resizable.PaneGroup>


