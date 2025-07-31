<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  
  import Terminal from "./Code/Terminal.svelte";
  import GraphDiff from "../Graph/GraphDiff.svelte";
</script>

<Resizable.PaneGroup direction="vertical" autoSaveId="terminalSRCSplit">
  <Resizable.Pane>
    <GraphDiff />
  </Resizable.Pane>

  <Resizable.Handle withHandle />

  <Resizable.Pane order={2} defaultSize={25}>
    <Terminal />
  </Resizable.Pane>
</Resizable.PaneGroup>