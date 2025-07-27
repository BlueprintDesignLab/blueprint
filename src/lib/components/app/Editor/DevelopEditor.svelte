<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  
  import { editorState } from '$lib/state/editor.svelte';
  import { fileWatcher } from '$lib/watcher/fileWatcher';
  import { loadSrcFile, saveSrcFile } from '$lib/util/srcFileIO';

  import Terminal from "./Canvas/Terminal.svelte";
  import GraphDiff from "./Canvas/GraphDiff.svelte";

  let unlisten: (() => void) | null = null;

  $effect(() => {
    unlisten?.();
    unlisten = null;

    loadSrcFile(editorState.currSrcPath).then(text => (editorState.currSrc = text));

    fileWatcher.addListener(e => {
      if (e.kind.includes('data') && e.paths.some(p => p.includes(editorState.currSrcPath)))
        loadSrcFile(editorState.currSrcPath).then(text => (editorState.currSrc = text));
    }).then((unl) => unlisten = unl);

    return (() => {
      unlisten?.();
    });
  })

  $effect(() => {
    console.log("saving src");
    editorState.currSrc;

    if (editorState.currSrcPath !== "") {
      saveSrcFile(editorState.currSrcPath, editorState.currSrc);
    }
  })
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