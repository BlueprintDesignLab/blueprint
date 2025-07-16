<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { open, save } from '@tauri-apps/plugin-dialog';

  type Node = {
    name: string;
    path: string;
    children?: Node[];
  };

  let tree: Node | null = $state(null);
  let error: string | null = $state(null);

  async function openProject() {
    console.log("pp");
    error = (null);
    const selected = await open({ directory: true });
    if (!selected) return;
    try {
      const result: Node = await invoke('read_project', { path: selected });
      tree = (result);
    } catch (e) {
      error = (String(e));
    }
  }

  async function newProject() {
    error = (null);
    const folder = await open({ directory: true, message: 'Choose parent folder' });
    if (!folder) return;
    const projectName = await save({ defaultPath: 'my-new-project', title: 'New project name' });
    if (!projectName) return;
    try {
      const result: Node = await invoke('create_project', {
        path: folder,
        name: projectName
      });
      tree = (result);
    } catch (e) {
      error = (String(e));
    }
  }
</script>

<!-- Tailwind-styled buttons -->
<div class="flex flex-col items-center gap-4 py-10">
  <h1 class="text-2xl font-semibold">Project Manager</h1>

  <div class="flex gap-4">
    <button class="btn-primary" onclick={openProject}>Open project</button>
    <button class="btn-secondary" onclick={newProject}>Create new project</button>
  </div>

  {#if error}
    <p class="text-red-500 mt-4">{error}</p>
  {/if}

  {#if tree}
    <pre class="bg-gray-800 text-gray-200 p-4 rounded mt-6 w-full max-w-3xl overflow-auto">
      {JSON.stringify(tree, null, 2)}
    </pre>
  {/if}
</div>
