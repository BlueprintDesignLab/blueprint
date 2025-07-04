<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs/index.js";

  import CodeMirror from "svelte-codemirror-editor";

  import { keymap } from "@codemirror/view";
  import type { Extension } from "@codemirror/state";
  import { yaml } from "@codemirror/lang-yaml";
  // import { ayuLight } from "thememirror";

  import { saveGraphSemantic, saveGraphView } from "$lib/util/graphIO";

  import { exampleJSON, exampleYaml } from "$lib/example";

  import { graphCode } from "$lib/state/graph.svelte";

  import { onMount } from "svelte";

  import JSZip from "jszip";

  import Button from "./ui/button/button.svelte";
  import { Download, Upload } from "lucide-svelte";

  let semDerived = $derived(saveGraphSemantic(graphCode.getSelectedGraph()));
  let viewDerived = $derived(saveGraphView(graphCode.getSelectedGraph()));

  // $inspect(semDerived);
  // $inspect(graphCode.filtering);

  onMount(() => {
    semDerived = "hi";

    graphCode.loadGraph(exampleYaml, exampleJSON);
  });
  // const saveKey: Extension = keymap.of([
  //   {
  //     key: "Mod-s", // “Mod” = Ctrl on Win/Linux, ⌘ on macOS
  //     preventDefault: true,
  //     run() {
  //       updateGraph();
  //       return true; // signals “handled”
  //     },
  //   },
  // ]);

  function updateGraph() {
    try {
      graphCode.loadGraph(semDerived, viewDerived);
    } catch (e) {
      //suppress in-between invalid YAML states
    }
  }

  async function downloadZip() {
    const zip = new JSZip();
    zip.file("graph.blueprint.yaml", semDerived);
    zip.file("view.blueprint.json", viewDerived);

    const blob = await zip.generateAsync({ type: "blob" });
    triggerDownload(blob, "blueprint.zip");
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: filename,
    });
    a.click();
    URL.revokeObjectURL(url);
  }

  /** handle the <input type="file" …> change event */
  async function handleZipSelect(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return; // nothing chosen

    if (!file.name.endsWith(".zip")) {
      alert("Please select a .zip file");
      return;
    }

    try {
      const zip = await JSZip.loadAsync(file);

      const yamlEntry = zip.file(/\.blueprint\.ya?ml$/i)[0]; // graph.blueprint.yaml
      const viewEntry = zip.file(/\.blueprint\.json$/i)[0]; // view.blueprint.json

      if (!yamlEntry || !viewEntry) {
        alert("Zip must contain *.blueprint.yaml and *.blueprint.json");
        return;
      }

      /* read both in parallel */
      const [yamlStr, viewStr] = await Promise.all([
        yamlEntry.async("text"),
        viewEntry.async("text"),
      ]);

      graphCode.loadGraph(yamlStr, viewStr);
    } catch (err) {
      console.error(err);
      alert("Failed to load zip — see console for details");
    } finally {
      (e.currentTarget as HTMLInputElement).value = ""; // reset chooser
    }
  }
</script>

<!-- ——— Tabs -------------------------------------------------------- -->
<Tabs.Root value="graphVal" class="flex flex-col h-screen w-full">
  <Tabs.List
    class="w-full flex items-center gap-2
         flex-nowrap
         border-b border-slate-200 px-3"
  >
    <Tabs.Trigger value="graphVal">Graph</Tabs.Trigger>
    <Tabs.Trigger value="viewVal">View</Tabs.Trigger>

    <!-- right-aligned action area -->
    <span class="ms-auto flex gap-2">
      <Button
        variant="secondary"
        size="icon"
        class="size-8"
        onclick={downloadZip}
      >
        <Download />
      </Button>
    </span>

    <!-- place this anywhere inside the same <Tabs.List> action area -->
    <label
      class="inline-flex items-center justify-center size-8 rounded
         bg-secondary hover:bg-secondary/80 cursor-pointer"
    >
      <Upload class="w-4 h-4" />
      <input
        id="zipInput"
        type="file"
        accept=".zip"
        class="hidden"
        onchange={(e) => handleZipSelect(e)}
      />
    </label>
  </Tabs.List>
  <!-- {semDerived} -->
  <!-- YAML editor pane -->
  <Tabs.Content value="graphVal" class="flex-1 overflow-auto">
    <div class="editor-shell">
      <CodeMirror
        bind:value={semDerived}
        lineWrapping={true}
        lang={yaml()}
        on:change={() => updateGraph()}
      />
    </div>
  </Tabs.Content>

  <!-- View-only pane -->
  <Tabs.Content value="viewVal" class="flex-1 overflow-auto">
    <CodeMirror
      bind:value={viewDerived}
      lang={yaml()}
      on:change={() => updateGraph()}
    />
  </Tabs.Content>
</Tabs.Root>

<style>
  /* Now the shell just fills its flex-parent */
  .editor-shell {
    height: 100%; /* full height of Tabs.Content */
    width: 100%;
    /* overflow: auto; */
    box-sizing: border-box;
  }
</style>
