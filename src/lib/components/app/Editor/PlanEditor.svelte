<script lang="ts">
  import { onMount } from 'svelte';
  import { loadPlanFile, savePlanMd } from '$lib/util/planIO';

  import CodeDiff from './Canvas/CodeDiff.svelte';

  import { markdown } from '@codemirror/lang-markdown';
  
  import { editorState } from '$lib/state/editor.svelte';
  import { fileWatcher } from '$lib/watcher/fileWatcher';

  onMount(() => {
    loadPlanFile().then(text => (editorState.planMD = text));
    const unlisten = fileWatcher.addListener(e => {
      if (e.kind.includes('data') && e.paths.some(p => p.endsWith('/.blueprint/plan.md')))
        loadPlanFile().then(text => (editorState.planMD = text));
    });
    // return () => unlisten();
  });

  // $effect(() => {
  //   editorState.planMD;
  //   savePlanMd(editorState.planMD);
  // })

//   $inspect(editorState.proposedPlanMD);
</script>

<div class="editor-shell">
    <CodeDiff
      bind:content={editorState.planMD}
      bind:propose={editorState.proposedPlanMD}
      lineWrapping={true}
      lang={() => markdown()}
      onChange={() => savePlanMd(editorState.planMD)}
    />
</div>