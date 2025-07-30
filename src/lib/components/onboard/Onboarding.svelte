<!-- Onboarding.svelte -->
<script lang="ts" module>
  import { settingsStore } from '$lib/state/tauriStores';

  import {
    Code,
    Smartphone,
    AppWindow,
    ArrowLeft,
    Folder,
  } from 'lucide-svelte';

  // ------------------------- Editor list -------------------------
  const EDITORS = [
    { id: 'vscode', name: 'VS Code', Icon: Code },
    { id: 'any', name: 'Any', Icon: Code },
    { id: 'android-studio', name: 'Android Studio', Icon: Smartphone },
    { id: 'visual-studio', name: 'Visual Studio', Icon: AppWindow },
] as const;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import TideAnimation from './TideAnimation.svelte';

  let { onboarded = $bindable() } = $props();

  /* ---------- reactive state (runes) ---------- */
  let step = $state(0);               // 0 welcome | 1 editor | 2 blueprint
  let editor = $state<string | null>(null);
  let email = $state<string>('');

  let projectName = $state("");

  /* ---------- persistence ---------- */
  onMount(async () => {
      editor = await settingsStore.get<string>('editor') ?? null;
      email = await settingsStore.get<string>('email') ?? '';
  });

  $effect(() => {
      settingsStore.set('editor', editor);
      settingsStore.set('email', email);
      console.log(step, editor, email);
      // await store.save();
  });

  /* ---------- navigation helpers ---------- */
  const next = () => (step += 1);
  const back = () => (step -= 1);

  const finish = () => {
      settingsStore.set('onboarded', true);
      onboarded = true;
  };
</script>

<TideAnimation />
<!-- ------------------------- UI ------------------------- -->
<main class="relative z-10 flex h-screen w-full items-center justify-center bg-transparent text-foreground">
  <!-- Back & Skip buttons for every step -->
  {#if step > 0}
    <button
      class="absolute top-6 left-6 h-10 w-10 rounded-full border border-input bg-background flex items-center justify-center transition hover:bg-accent"
      onclick={back}
      aria-label="Go back"
    >
      <ArrowLeft size={20} />
    </button>
  {/if}

  <button
    class="absolute top-6 right-6 h-10 px-4 rounded-md border border-input bg-background text-sm font-medium transition hover:bg-accent"
    onclick={finish}
  >
    Skip
  </button>

  {#if step === 0}
    <!-- Welcome -->
    <div class="hero flex flex-col items-center gap-6">
      <h1 class="text-4xl font-bold">Welcome to Blueprint</h1>
      <p class="text-muted-foreground">Let’s get you set up in 30 seconds.</p>
      <button
        class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        onclick={next}
      >
        Get started
      </button>
    </div>

  {:else if step === 1}
    <!-- Editor -->
    <div class="flex w-full max-w-lg flex-col items-center gap-6">
      <h2 class="text-center text-2xl font-semibold">Pick your editor</h2>

      <div class="grid grid-cols-2 gap-4">
        {#each EDITORS as { id, name, Icon }}
          <button
            class="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-input bg-background transition hover:bg-accent hover:text-accent-foreground {editor === id ? 'ring-2 ring-primary' : ''}"
            onclick={() => {
              editor = id;
              next();
            }}
          >
            <Icon size={32} />
            <span class="text-sm font-medium">{name}</span>
          </button>
        {/each}
      </div>

      <p class="text-xs text-center text-muted-foreground max-w-xs">
        We recommend using the native Blueprint AI agent and a manual human IDE for the best experience.
      </p>
    </div>

  {:else if step === 2}
    <!-- Blueprint account -->
    <div class="flex w-full max-w-sm flex-col gap-6">
      <h2 class="text-center text-2xl font-semibold">Create a Blueprint account (Optional)</h2>

      <button
        class="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background text-sm"
      >
        Google Login
      </button>

      <div class="flex gap-4">
        <button
          class="flex-1 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          onclick={finish}
        >
          Next
        </button>
      </div>

      <p class="text-xs text-center text-muted-foreground">
        You can skip this and create one later in-app.
      </p>
    </div>
  {/if}
</main>

<!-- {:else if step === 3}
    <div class="flex w-full max-w-sm flex-col gap-6">
      <h2 class="text-center text-2xl font-semibold">Name your first project</h2>

      <div class="relative">
        <Folder class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20}/>
        <input
          type="text"
          placeholder="my-awesome-app"
          bind:value={projectName}
          class="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm"
        />
      </div>

      <p class="text-xs text-center text-muted-foreground">
        All projects are created inside <code class="bg-muted rounded px-1">/BlueprintProjects</code>
        for sandboxing and security.
      </p>

      <button
        class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        onclick={finish}
      >
        Finish & Launch
      </button>
    </div> -->