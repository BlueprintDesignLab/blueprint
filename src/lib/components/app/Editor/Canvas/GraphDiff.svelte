<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  import { onMount } from "svelte";

  import GraphView from "../../Graph/GraphView.svelte";

  import { loadGraphFiles } from "$lib/util/graphIO";
  import { graphCode } from "$lib/state/graph.svelte";
  import { fileWatcher } from "$lib/watcher/fileWatcher";

  onMount(() => {
    loadGraphFiles().then((graph) => {
        graphCode.loadGraph(graph.yaml, graph.view);
    });

    const unlisten = fileWatcher.addListener(e => {
      if (e.kind.includes('data') &&
          e.paths.some(p => p.endsWith('/.blueprint/graph.yaml') || p.endsWith('/.blueprint/view.json')))
        loadGraphFiles().then((graph) => {
          graphCode.loadGraph(graph.yaml, graph.view);
        });
    });

    // return () => unlisten();
  });

</script>

<Resizable.PaneGroup direction="horizontal" autoSaveId="graphDiff">
  <Resizable.Pane defaultSize={50}>
    <GraphView bind:nodes={graphCode.nodes} bind:edges={graphCode.edges} />
  </Resizable.Pane>

  {#if graphCode.proposedNodes.length !== 0}
    <!-- {propose} -->
    <Resizable.Handle withHandle />

    <Resizable.Pane defaultSize={50}>
      <GraphView bind:nodes={graphCode.proposedNodes} bind:edges={graphCode.proposedEdges} />
    </Resizable.Pane>
  {/if}
</Resizable.PaneGroup>
