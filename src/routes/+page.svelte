<script lang="ts">
  import ProjectSelector from "$lib/components/onboard/ProjectSelector.svelte";
  import Onboarding from "$lib/components/onboard/Onboarding.svelte";
  import Watcher from "$lib/components/onboard/Watcher.svelte";

  import { tauriStore } from '$lib/state/tauriStore';
  import { onMount } from "svelte";
  import App from "$lib/components/App.svelte";

  let onboarded = $state<boolean>(true);
  $inspect(onboarded);

  // src/lib/context.ts
  const data = (window as any).__TAURI_INITIAL_DATA__;

  let ready = $state(false);
  const projectRoot = data?.projectRoot ?? null;

  async function getonboarded() {
    // tauriStore.set('onboarded', false);
    onboarded = await tauriStore.get<boolean>('onboarded') ?? false;
    ready = true;
  }

  onMount(() => {
    getonboarded();
  });
</script>


<div id="app" class="h-screen w-screen">
{#if projectRoot}
  <Watcher />
  <App />
{:else if ready}
  {#if onboarded}
    <ProjectSelector />
  {:else}
    <Onboarding bind:onboarded /> 
  {/if}
{/if}
</div>


