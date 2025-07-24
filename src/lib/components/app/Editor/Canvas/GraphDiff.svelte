<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";

  import GraphViewCopy from "../../Graph/GraphSingle.svelte";

  import { graphCode } from "$lib/state/graph.svelte";
</script>

<Resizable.PaneGroup direction="horizontal" autoSaveId="graphDiff">
  <Resizable.Pane defaultSize={50}>
    {#if graphCode.previewGraph === null}
      <GraphViewCopy />
    <!-- {:else}
      <GraphView bind:nodes={graphCode.previewGraph.nodes} bind:edges={graphCode.previewGraph.edges} /> -->
      <!-- <Button onclick={() => graphCode.commitGraph()}>Save</Button> -->
    {/if}
  </Resizable.Pane>

  <!-- {#if graphCode.proposedNodes.length !== 0}
    <Resizable.Handle withHandle />

    <Resizable.Pane defaultSize={50}>
      <GraphView bind:nodes={graphCode.proposedNodes} bind:edges={graphCode.proposedEdges} />
    </Resizable.Pane>
  {/if} -->
</Resizable.PaneGroup>
