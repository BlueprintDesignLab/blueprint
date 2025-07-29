<script lang="ts">
  import { jsonrepair } from 'jsonrepair';
  import CollapsibleRow from './CollapsibleRow.svelte';

  interface Props {
    rawArgs: string | null | undefined;   // <- original (possibly broken) JSON string
  }
  let { rawArgs }: Props = $props();

  // safe parse + fallback
  let parsed: any = $state({});

  $effect(() => {
    try {
      const newParsed = JSON.parse(jsonrepair(rawArgs ?? ""));

      if (JSON.stringify(newParsed).length > JSON.stringify(parsed).length) {
        parsed = newParsed;
      }
    } catch {}
  })
</script>

{#each Object.entries(parsed) as [key, value]}
  <div class="min-w-0">
    <!-- {#if key === '__raw'} -->
    <!-- <pre class="text-sm text-slate-400 bg-slate-900 p-2 rounded overflow-x-auto">{value}</pre>
    {:else} -->
      <CollapsibleRow {key} {value} />
    <!-- {/if} -->
  </div>
{/each}