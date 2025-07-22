<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  import { onMount } from 'svelte';

  import { markdown } from '@codemirror/lang-markdown';
  
  import { editorState } from '$lib/state/editor.svelte';
  import { fileWatcher } from '$lib/watcher/fileWatcher';
  import { loadSrcFile, saveSrcFile } from '$lib/util/srcFileIO';

  import { FileText } from 'lucide-svelte';

  import Terminal from "./Canvas/Terminal.svelte";
  import CodeDynam from "./Canvas/CodeDynam.svelte";

  // onMount(() => {
  //   loadSrcFile(editorState.currSrcPath).then(text => (editorState.currSrc = text));
  //   // const unlisten = fileWatcher.addListener(e => {
  //   //   if (e.kind.includes('data') && e.paths.some(p => p.includes('/src')))
  //   //     loadSrcFile(editorState.currSrcPath).then(text => (editorState.currSrc = text));
  //   // });
  //   // return () => unlisten();
  // });

  $effect(() => {
    loadSrcFile(editorState.currSrcPath).then(text => (editorState.currSrc = text));
  })

  $effect(() => {
    console.log("saving src");
    editorState.currSrc;
    saveSrcFile(editorState.currSrcPath, editorState.currSrc);
  })
</script>

<Resizable.PaneGroup direction="vertical" autoSaveId="terminalSRCSplit">
  <Resizable.Pane>
    <!-- Header -->
    <header
      class="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-950"
    >
      <FileText size={16} class="text-gray-500 dark:text-gray-400" />

      <span class="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
        {editorState.currSrcPath}
      </span>

      <span
        class="ml-auto shrink-0 rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
      >
        {editorState.currSrcPath.split('.').pop()?.toUpperCase()}
      </span>
    </header>

    <!-- Editor -->
    <div class="editor-shell">
      <CodeDynam
        bind:content={editorState.currSrc}
        bind:propose={editorState.proposedCurrSrc}
        lineWrapping
        lang={markdown}
        onChange={() => saveSrcFile(editorState.currSrcPath, editorState.currSrc)}
      />
    </div>
  </Resizable.Pane>

  <Resizable.Handle withHandle />

  <Resizable.Pane order={2} defaultSize={25}>
    <Terminal />
  </Resizable.Pane>
</Resizable.PaneGroup>