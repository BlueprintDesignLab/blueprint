<script lang="ts">
  import * as Accordion from '$lib/components/ui/accordion/index';
  import { File, Folder as FolderIcon, ChevronRight } from 'lucide-svelte';

  import FileTree from "./FileTree.svelte";
  import Button from '$lib/components/ui/button/button.svelte';
  import { editorState } from '$lib/state/editor.svelte';

  interface Props {
    tree: FileNode[];
  }

  let { tree }: Props = $props();
</script>

{#each tree as node (node.name)}
  {#if node.type === 'folder'}
    <Accordion.Root>
      <Accordion.Item value={node.name} class="border-none">
        <Accordion.Trigger class="flex items-center gap-1 py-1 text-sm font-medium hover:no-underline">
          <span>{node.name}</span>
        </Accordion.Trigger>
        <Accordion.Content class="pl-6">
          <FileTree tree={node.children ?? []} />
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  {:else}
    <div class="flex items-center gap-2 py-1 pl-5 text-sm">
      <Button onclick={() => editorState.currSrcPath = node.path}>
        <File class="w-4 h-4 text-muted-foreground" />
        <span>{node.name}</span>
      </Button>
    </div>
  {/if}
{/each}