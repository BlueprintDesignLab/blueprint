<script lang="ts">
  import { type Extension } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import CodeDouble from './CodeDouble.svelte';
  import CodeSingle from './CodeSingle.svelte';

  interface Props {
    propose?: string;
    content?: string;
    theme?: 'light' | 'dark';
    readOnly?: boolean;
    klass?: string;
    lineWrapping?: boolean;
    lang?: () => Extension;
    onChange?: () => void;
  }

  let {
    propose = $bindable(''),
    content = $bindable(''),
    theme = 'light',
    readOnly = false,
    klass = '',
    lineWrapping = false,
    lang = markdown,
    onChange = () => {},
  }: Props = $props();

</script>

<div class="flex flex-col h-full">

  <!-- this div will actually scroll -->
  <div class="flex-1 min-h-0  overflow-hidden">
    {#if propose !== ""}
        <CodeDouble 
            bind:content
            bind:propose
            {lineWrapping}
            {readOnly}
            {theme}
            {lang}
            {klass}
        />

    {:else}
        <CodeSingle
            bind:content
            {lineWrapping}
            {readOnly}
            {theme}
            {lang}
            {onChange}
            {klass}
        />
    {/if}
  </div>
</div>
