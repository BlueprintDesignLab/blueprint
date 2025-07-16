<!-- <script module>
  import { getContext } from "svelte";

  export const useDnD = () => {
    return getContext("dnd") as { current: string | null };
  };
</script>

<script lang="ts">
  import { onDestroy, setContext, type Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  let dndType = $state(null);

  setContext("dnd", {
    set current(value) {
      dndType = value;
    },
    get current() {
      return dndType;
    },
  });

  onDestroy(() => {
    dndType.set(null);
  });
</script>

{@render children()} -->

<!-- // let yamlInput: HTMLInputElement = $state();
  // let viewInput: HTMLInputElement = $state();

  // /** the two files we need */
  // let yamlFile: File | null = $state(null);
  // let viewFile: File | null = $state(null);

  // $inspect(yamlFile);

  // /* ───────── drag-and-drop helpers ───────── */
  // function prevent(
  //   e: DragEvent | (DragEvent & { dataTransfer: DataTransfer })
  // ) {
  //   e.preventDefault();
  //   e.stopPropagation();
  // }

  // /** handle drop OR programmatic selection */
  // function handleFiles(list: FileList | null) {
  //   if (!list) return;
  //   for (const f of Array.from(list)) {
  //     if (f.name.endsWith(".bpl.yaml")) yamlFile = f;
  //     else if (f.name.endsWith(".sfv.json")) viewFile = f;
  //     else alert("File extension not supported");
  //   }
  // }

  // function handleDrop(e: DragEvent) {
  //   prevent(e);
  //   handleFiles(e.dataTransfer?.files ?? null);
  // }

  // /* your existing loader */
  // async function renderGraph() {
  //   if (!yamlFile) {
  //     alert("Missing *.gfl.yaml");
  //     return;
  //   }

  //   const graph = await loadGraph(yamlFile, viewFile);
  //   console.log(graph);
  //   nodes = graph["nodes"];
  //   edges = graph["edges"];
  // } -->

<!-- {#if nodes.length === 0} -->
<!-- <div
      class="min-h-screen flex flex-col items-center justify-center bg-slate-50"
    >
      <div
        class="flex flex-col items-center justify-center gap-4
         rounded-xl border-4 border-dashed border-slate-300/80 bg-white
         hover:bg-slate-100 transition-colors w-[min(90vw,42rem)] h-72
         cursor-pointer select-none p-8"
        ondragover={prevent}
        ondrop={handleDrop}
        role="region"
      >
        <UploadCloud size="80" class="text-slate-400" />

        <p class="text-lg md:text-xl font-semibold text-slate-600">
          Drop <code class="font-mono">*.bpl.yaml</code>
          <span class="hidden md:inline">and</span><br class="md:hidden" />
          <code class="font-mono">*.sfv.json(optional)</code> here
        </p>

        <span class="text-sm text-slate-500">or use the buttons below</span>

        <div class="flex flex-wrap gap-4 mt-4 w-full justify-center">
          <button
            class="inline-flex items-center gap-2 rounded-md px-4 py-2
             transition-colors
             {yamlFile
              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
              : 'bg-slate-800 text-white hover:bg-slate-700'}"
            onclick={() => yamlInput.click()}
          >
            <FilePlus size="18" />
            {yamlFile ? "✓ YAML loaded" : "YAML"}
          </button>

          <button
            class="inline-flex items-center gap-2 rounded-md px-4 py-2
             transition-colors
             {viewFile
              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
              : 'bg-slate-800 text-white hover:bg-slate-700'}"
            onclick={() => viewInput.click()}
          >
            <FilePlus size="18" />
            {viewFile ? "✓ View JSON loaded" : "View JSON"}
          </button>

          <button
            class="inline-flex items-center gap-2 rounded-md px-4 py-2
             transition-colors
             bg-emerald-600 text-white hover:bg-emerald-500
             disabled:bg-slate-300 disabled:text-slate-500"
            disabled={!yamlFile}
            onclick={renderGraph}
          >
            <Play size="18" />
            Render
          </button>
        </div>

        {#if yamlFile || viewFile}
          <div class="mt-4 w-full text-sm text-center space-y-1">
            {#if yamlFile}
              <div class="text-emerald-700">📄 {yamlFile.name}</div>
            {/if}
            {#if viewFile}
              <div class="text-emerald-700">📄 {viewFile.name}</div>
            {/if}
          </div>
        {/if}
      </div>

      <input
        type="file"
        accept=".bpl.yaml,.yaml"
        bind:this={yamlInput}
        class="hidden"
        onchange={(e) => handleFiles((e.target as HTMLInputElement).files)}
      />

      <input
        type="file"
        accept=".sfv.json,.json"
        bind:this={viewInput}
        class="hidden"
        onchange={(e) => handleFiles((e.target as HTMLInputElement).files)}
      />

      <button
        onclick={loadDemo}
        class="mt-8 inline-flex items-center gap-2
            bg-emerald-600 hover:bg-emerald-700 text-white
            font-semibold py-3 px-6 rounded-lg shadow-lg
            focus:outline-none focus:ring-4 focus:ring-emerald-300"
      >
        <PlayCircle size="20" />
        Load Demo Graph
      </button>
    </div> -->
<!-- {:else} -->

<!-- function loadDemo() {
    console.log(data["nodes"]);
    // @ts-ignore
    nodes = data["nodes"];
    // @ts-ignore
    edges = data["edges"];
  } -->

<!-- function downloadJSON() {
    console.log("lols");
    const payload = {
      nodes: nodes, // or whatever your store is called
      edges: edges,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "c4flow-graph.json";
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } -->

<!-- <script lang="ts">
  import { useDnD } from "./DnDProvider.svelte";

  const type = useDnD();

  const onDragStart = (event: DragEvent, nodeType: string) => {
    if (!event.dataTransfer) {
      return null;
    }

    type.current = nodeType;

    event.dataTransfer.effectAllowed = "move";
  };
</script>

<aside>
  <div class="nodes-container"></div>
</aside>

<div
  class="input-node node"
  on:dragstart={(event) => onDragStart(event, "input")}
  draggable={true}
>
  Input Node
</div>
<div
  class="default-node node"
  on:dragstart={(event) => onDragStart(event, "default")}
  draggable={true}
>
  Default Node
</div>
<div
  class="output-node node"
  on:dragstart={(event) => onDragStart(event, "output")}
  draggable={true}
>
  Output Node
</div>

<style>
  aside {
    width: 100%;
    background: #fff;
    font-size: 12px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .nodes-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .node {
    margin: 0.5rem;
    border: 1px solid #111;
    padding: 0.5rem 1rem;
    font-weight: 700;
    border-radius: 5px;
    cursor: grab;
  }
</style> -->
