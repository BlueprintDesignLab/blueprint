<script lang="ts">
  interface Props {
    key: string;
    value: unknown;
    limit?: number;
  }
  let { key, value, limit = 200 }: Props = $props();

  function toDisplay(v: unknown): string {
    if (typeof v === "string") return v;
    return JSON.stringify(v, null, 2);           
  }

  const str   = $derived(toDisplay(value));
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

  <!-- {#if str && isLong && !open}
    <span class="text-sm text-slate-400">
      {str?.slice(0, limit)}…
    </span>
  {:else} -->
    <pre class="text-sm text-slate-400 bg-slate-900 p-2 rounded overflow-x-auto">{open ? str : str?.slice(0, limit) + "..."}</pre>
  <!-- {/if} -->
</div>