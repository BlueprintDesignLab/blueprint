<script lang="ts">
  import ProjectSelector from "$lib/components/onboard/ProjectSelector.svelte";

  import { projectRoot } from '$lib/state/tauriStores';
  
  import App from "$lib/components/App.svelte";

  let ready = $state(true);

  // async function getonboarded() {
  //   // tauriStore.set('onboarded', false);
  //   onboarded = await settingsStore.get<boolean>('onboarded') ?? false;
  //   ready = true;
  // }

  // onMount(async () => {
  //   getonboarded();
  // });
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


