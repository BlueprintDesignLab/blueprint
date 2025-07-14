<script lang="ts">
  import "../app.css";
  import { SvelteFlowProvider } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";

  import { listen } from '@tauri-apps/api/event';
  import { onMount } from "svelte";

  
  let { children } = $props();

  onMount(() => {
    listen('fs-event', (event) => {
      console.log(event);
    });
  })
</script>

<SvelteFlowProvider>
  {@render children()}
</SvelteFlowProvider>
