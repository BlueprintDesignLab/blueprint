<script lang="ts">
  import "../app.css";

  import { SvelteFlowProvider } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";

  import { Toaster } from "$lib/components/ui/sonner";

  let { children } = $props();

  import { onMount } from 'svelte';
  import { initDeepLinkAuth } from '$lib/authStore';

  onMount(() => initDeepLinkAuth());
</script>

<Toaster position="top-center"/>

<SvelteFlowProvider>
  {@render children()}
</SvelteFlowProvider>
