<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";

  import GraphCodeFlow from "./GraphCodeFlow.svelte";
  import GraphView from "./GraphView.svelte";

  import { graphCode } from "$lib/state/graph.svelte";
</script>

<Resizable.PaneGroup direction="horizontal" autoSaveId="graphDiff">
  <Resizable.Pane defaultSize={50}>
    {#if graphCode.previewGraph === null}
      <GraphCodeFlow />
    {:else}
      <GraphView bind:nodes={graphCode.previewGraph.nodes} bind:edges={graphCode.previewGraph.edges} />
      <!-- <!-- <Button onclick={() => graphCode.commitGraph()}>Save</Button> -->
    {/if}
  </Resizable.Pane>
</Resizable.PaneGroup>
