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
    onChange?: (content:string) => void;
  }

  let {
    propose = $bindable(''),
    content = $bindable(''),
    theme = 'light',
    readOnly = false,
    klass = '',
    lineWrapping = false,
    lang = markdown,
    onChange = (content:string) => {},
  }: Props = $props();

</script>


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

