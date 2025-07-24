<script lang="ts">
    import { Separator } from "$lib/components/ui/separator";
    import { open } from '@tauri-apps/plugin-dialog';
    import { onMount } from "svelte";

    import { LazyStore } from '@tauri-apps/plugin-store';
    import { invoke } from "@tauri-apps/api/core";
  import DeskAnimation from "./DeskAnimation.svelte";

    const store = new LazyStore('settings.json');

    let recent: string[] = $state([]);

    onMount(() => {
        store.get<string[]>('recentProjects').then((v) => {
        if (Array.isArray(v)) {
            recent = v;
        } else {
            recent = [];
        }
        });
    });

    async function openProject() {
        const folderPath = await open({
            multiple: false,
            directory: true,
        });

        await openProjectPath(folderPath);
    }

    async function openProjectPath(folderPath: string | null) {
        if (!folderPath) return;

        await invoke("open_project", {folderPath});
        addRecent(folderPath);
    }

    function addRecent(p: string) {
        recent = [p, ...recent.filter(r => r !== p)].slice(0, 8);
        store.set('recentProjects', recent);
    }
</script>

<DeskAnimation />

<main class="relative flex h-screen w-full items-center justify-center bg-transparent text-foreground">
  <div class="flex flex-col items-center gap-8 max-w-md">
    <h1 class="text-4xl font-bold">Your Projects</h1>

    <div class="grid w-full gap-4">
      <!-- Open -->
      <button
        class="flex h-14 w-full items-center gap-4 rounded-lg border border-input bg-background p-4 text-left transition hover:bg-accent"
        onclick={openProject}
      >
        <span class="text-base font-medium">Open Project</span>
      </button>
    </div>

    {#if recent.length}
      <Separator class="my-2" />
      <h2 class="text-lg font-semibold">Recent</h2>
      <div class="w-full space-y-2">
        {#each recent as p}
          <button
            class="w-full truncate rounded px-3 py-2 text-left text-sm transition hover:bg-accent"
            onclick={() => openProjectPath(p)}
          >
            {p}
          </button>
        {/each}
      </div>
    {/if}

    <!-- <p class="text-xs text-center text-muted-foreground/70 max-w-xs mx-auto leading-snug">
        “Give me six hours to chop down a tree and I will spend the first four sharpening the axe.”
        <br />
        <span class="text-teal-400 font-medium">- Abraham Lincoln</span>
    </p> -->
  </div>
</main>