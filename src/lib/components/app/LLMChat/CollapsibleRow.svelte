<script lang="ts">
  interface Props {
    key: string;
    value: unknown;
    limit?: number;
  }
  let { key, value, limit = 200 }: Props = $props();

  const str = $derived(JSON.stringify(value));
  const isLong = $derived(str.length > limit);

  let open = $state(false);        // one flag per row
</script>

<div class="min-w-0">
  <div class="flex items-center gap-2">
    <strong>{key}:</strong>

    {#if isLong}
      <button
        class="text-xs underline text-blue-400"
        onclick={() => (open = !open)}
      >
        {open ? 'hide' : 'show'}
      </button>
    {/if}
  </div>

  {#if str && isLong && !open}
    <span class="text-sm text-slate-400">
      {str?.slice(0, limit)}…
    </span>
  {:else}
    <pre class="min-w-0 text-sm text-slate-400 bg-slate-900 p-4 rounded overflow-x-auto">
{str}</pre>
  {/if}
</div>