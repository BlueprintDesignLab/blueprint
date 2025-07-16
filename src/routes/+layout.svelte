<script lang="ts">
  import "../app.css";

  import { SvelteFlowProvider } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";

  import { Toaster } from "$lib/components/ui/sonner";

  let { children } = $props();
</script>

<Toaster position="top-center"/>

<SvelteFlowProvider>
  {@render children()}
</SvelteFlowProvider>
