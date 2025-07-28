<script lang="ts">
  import { jsonrepair } from 'jsonrepair';
  import CollapsibleRow from './CollapsibleRow.svelte';

  interface Props {
    rawArgs: string | null | undefined;   // <- original (possibly broken) JSON string
  }
  let { rawArgs }: Props = $props();

  // safe parse + fallback
  const parsed = $derived.by(() => {
    const src = String(rawArgs ?? '').trim();
    if (!src) return {};                 // empty
    try {
      return JSON.parse(jsonrepair(src));
    } catch {
      return { __raw: src };             // plain text fallback
    }
  });
</script>

{#each Object.entries(parsed) as [key, value]}
  <div class="min-w-0">
    {#if key === '__raw'}
      <pre class="text-sm text-slate-400 bg-slate-900 p-2 rounded">{value}</pre>
    {:else}
      <CollapsibleRow {key} {value} />
    {/if}
  </div>
{/each}