<script lang="ts">
  import "../app.css";
  import { SvelteFlowProvider } from "@xyflow/svelte";
  import DnDProvider from "$lib/components/DnDProvider.svelte";
  import "@xyflow/svelte/dist/style.css";
  import Greet from "$lib/components/Greet.svelte";
  
  let { children } = $props();
</script>

<SvelteFlowProvider>
  {@render children()}
</SvelteFlowProvider>

<!-- <Greet /> -->
