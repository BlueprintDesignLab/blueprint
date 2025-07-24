<script lang="ts">
  import { savePlanMd } from '$lib/util/planIO';

  import { markdown } from '@codemirror/lang-markdown';
  
  import { editorState } from '$lib/state/editor.svelte';
  import { FileText } from 'lucide-svelte';

  import CodeDynam from './Canvas/CodeDynam.svelte';

  $effect(() => {
    console.log("save plan");
    savePlanMd(editorState.planMD);
  })
</script>

<!-- Header -->
<header
  class="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-950"
>
  <FileText size={16} class="text-gray-500 dark:text-gray-400" />

  <span class="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
    plan
  </span>

  <span
    class="ml-auto shrink-0 rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
  >
    .md
  </span>
</header>

<CodeDynam
  bind:content={editorState.planMD}
  bind:propose={editorState.proposedPlanMD}

  lineWrapping={true}
  lang={() => markdown()}
/>

