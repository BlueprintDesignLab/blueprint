<script lang="ts">
  import { parse } from 'yaml';
  import FileTree from './FileTree.svelte';

  let {filteredSem} = $props();

  let tree = $derived(yamlToFileNodes(filteredSem));

  $inspect(tree);

  function yamlToFileNodes(yamlText: string): FileNode[] {
    const doc = parse(yamlText) as {
      nodes?: Record<string, {
        label?: string;
        main_file: string;
        helper_files?: string[];
        comment?: string;
      }>;
      edges?: Record<string, {
        label?: string;
        schema_file?: string;
        stub_files?: Record<string, string>;
        interface_file?: string;
        source: string;
        target: string;
        comment?: string;
      }>;
    };

    const folders = createFolders(doc);

    return folders;
  }

  // ------------------------------------------------------------------
  // Helper – add a path (file or folder) under a parent FileNode,
  // creating intermediate folders on demand.
  // ------------------------------------------------------------------
  function addPath(parent: FileNode, filePath: string, kind: 'file' | 'folder') {
    let cursor = parent;
    const parts = filePath.split('/').filter(Boolean); // split & drop empty
    const lastIdx = parts.length - 1;

    // const typeHere = idx === lastIdx ? kind : 'folder';
    const newNode: FileNode = { name: filePath, path: filePath, type: kind };
    if (kind === 'folder') newNode.children = [];
    cursor.children = cursor.children || [];
    cursor.children.push(newNode);

    // parts.forEach((part, idx) => {
    //   const exists = cursor.children?.find(c => c.name === part);
    //   if (exists) {
    //     cursor = exists;
    //   } else {
    //     // Decide whether this segment is a file or folder
    //     const typeHere = idx === lastIdx ? kind : 'folder';
    //     const newNode: FileNode = { name: part, path: filePath, type: typeHere };
    //     if (typeHere === 'folder') newNode.children = [];
    //     cursor.children = cursor.children || [];
    //     cursor.children.push(newNode);
    //     cursor = newNode;
    //   }
    // });
  }

  function createFolders(doc: any) {
    const root: FileNode = { name: '', type: 'folder', path: '', children: [] };

    // ------------------------------------------------------------------
    // 1. Nodes
    // ------------------------------------------------------------------
    Object.entries(doc.nodes || {}).forEach(([nodeId, node]) => {
      // Node folder
      const nodeFolder: FileNode = { name: nodeId, type: 'folder', path: '', children: [] };
      root.children!.push(nodeFolder);

      // main_file
      addPath(nodeFolder, node.main_file, 'file');

      // helper_files folder
      if (node.helper_files?.length) {
        node.helper_files.forEach(p => addPath(nodeFolder, p, 'file'));
      }
    });

    // ------------------------------------------------------------------
    // 2. Edges
    // ------------------------------------------------------------------
    Object.entries(doc.edges || {}).forEach(([edgeId, edge]) => {
      const edgeFolder: FileNode = { name: edgeId, type: 'folder', path: '', children: [] };
      root.children!.push(edgeFolder);

      if (edge.schema_file) addPath(edgeFolder, edge.schema_file, 'file');
      if (edge.interface_file) addPath(edgeFolder, edge.interface_file, 'file');

      Object.values(edge.stub_files || {}).forEach(p => addPath(edgeFolder, p, 'file'));
    });

    return root.children!;
  }
</script>

<main class="p-4 max-w-sm">
  <FileTree {tree} />
</main>