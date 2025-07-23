<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";

  import { markdown } from '@codemirror/lang-markdown';
  
  import { editorState } from '$lib/state/editor.svelte';
  import { fileWatcher } from '$lib/watcher/fileWatcher';
  import { loadSrcFile, saveSrcFile } from '$lib/util/srcFileIO';

  import { FileText } from 'lucide-svelte';

  import Terminal from "./Canvas/Terminal.svelte";
  import CodeDynam from "./Canvas/CodeDynam.svelte";

  import { saveGraphSemantic } from "$lib/util/graphIO";
  import { graphCode } from "$lib/state/graph.svelte";

  import { parse } from "yaml";
  import FileTree from "./Canvas/FileTree.svelte";
  import FileTreeExample from "./Canvas/FileTreeExample.svelte";

  let unlisten: (() => void) | null = null;

  /**
   * Strip a full blueprint YAML down to the minimal subset
   * we care about for tooling.
   */
  export function stripBlueprint(
    inputStr: string
  ): Pick<typeof input, 'nodes' | 'edges'> {
    const input = parse(inputStr);
    const out: ReturnType<typeof stripBlueprint> = { nodes: {}, edges: {} };

    // --- nodes ----------------------------------------------------------
    for (const [id, node] of Object.entries<any>(input.nodes ?? {})) {
      out.nodes[id] = {
        main_file: node.main_file,
        ...(node.helper_files?.length && { helper_files: node.helper_files }),
      };
    }

    // --- edges ----------------------------------------------------------
    for (const [id, edge] of Object.entries<any>(input.edges ?? {})) {
      out.edges[id] = {
        ...(edge.schema && { schema_file: edge.schema }),
        ...(edge.stubs && { stub_files: edge.stubs }),
        ...(edge.interface_file && { interface_file: edge.interface_file }),
      };
    }

    return out;
  }

  $effect(() => {
    unlisten?.();
    unlisten = null;

    loadSrcFile(editorState.currSrcPath).then(text => (editorState.currSrc = text));

    fileWatcher.addListener(e => {
      if (e.kind.includes('data') && e.paths.some(p => p.includes(editorState.currSrcPath)))
        loadSrcFile(editorState.currSrcPath).then(text => (editorState.currSrc = text));
    }).then((unl) => unlisten = unl);
  })

  $effect(() => {
    console.log("saving src");
    editorState.currSrc;
    saveSrcFile(editorState.currSrcPath, editorState.currSrc);
  })

  let semDerived = $derived(saveGraphSemantic(graphCode.getGraph()));

  let semFiles = $derived(stripBlueprint(semDerived));

  $inspect(semDerived);
  $inspect(semFiles);
</script>

<Resizable.PaneGroup direction="horizontal" autoSaveId="explorerSrcSplit">
  <Resizable.Pane defaultSize={10}>
    <FileTreeExample filteredSem={semDerived} />
  </Resizable.Pane>

  <Resizable.Handle withHandle />

  <Resizable.Pane defaultSize={25}>
    <Resizable.PaneGroup direction="vertical" autoSaveId="terminalSRCSplit">
      <Resizable.Pane>
        <!-- Header -->
        <header
          class="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-950"
        >
          <FileText size={16} class="text-gray-500 dark:text-gray-400" />

          <span class="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
            {editorState.currSrcPath}
          </span>

          <span
            class="ml-auto shrink-0 rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          >
            {editorState.currSrcPath.split('.').pop()?.toUpperCase()}
          </span>
        </header>

        <!-- Editor -->
        <div class="editor-shell">
          <CodeDynam
            bind:content={editorState.currSrc}
            bind:propose={editorState.proposedCurrSrc}
            lineWrapping
            lang={markdown}
            onChange={() => saveSrcFile(editorState.currSrcPath, editorState.currSrc)}
          />
        </div>
      </Resizable.Pane>

      <Resizable.Handle withHandle />

      <Resizable.Pane order={2} defaultSize={25}>
        <Terminal />
      </Resizable.Pane>
    </Resizable.PaneGroup>

  </Resizable.Pane>
</Resizable.PaneGroup>