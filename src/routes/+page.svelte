<script lang="ts">
  import ProjectSelector from "$lib/components/onboard/ProjectSelector.svelte";

  import { tauriStore } from '$lib/state/tauriStore';
  import { onMount } from "svelte";
  import App from "$lib/components/App.svelte";
  import { invoke } from "@tauri-apps/api/core";

  let onboarded = $state<boolean>(true);
  // $inspect(onboarded);

  const data = (window as any).__TAURI_INITIAL_DATA__;

  let ready = $state(false);
  const projectRoot = data?.projectRoot ?? null;

  async function getonboarded() {
    // tauriStore.set('onboarded', false);
    onboarded = await tauriStore.get<boolean>('onboarded') ?? false;
    ready = true;
  }

  onMount(async () => {
    getonboarded();

    const root = await invoke("get_project_root");
    console.log(root);
  });
</script>


<div id="app" class="h-screen w-screen">
{#if projectRoot}
  <App />
{:else if ready}
  <!-- {#if onboarded} -->
    <ProjectSelector />
  <!-- {:else}
    <Onboarding bind:onboarded /> 
  {/if} -->
{/if}
</div>


