<script lang="ts">
  import { MergeView } from '@codemirror/merge';
  import { EditorView, basicSetup } from 'codemirror';
  import { EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';

  interface Props {
    propose?: string;
    content?: string;
    theme?: 'light' | 'dark';
    readOnly?: boolean;
    class?: string;
    lineWrapping?: boolean;
    lang?: () => any; // You can be more specific here based on your language extensions
    onChange?: () => void;
  }

  let { 
    propose = $bindable(''), 
    content = $bindable(''), 
    theme = 'light', 
    readOnly = false, 
    class: klass = '',
    lineWrapping = false,
    lang = markdown, // Default to markdown
    onChange = () => {} // Default to no-op
  }: Props = $props();

  let container: HTMLDivElement;
  let view: MergeView | EditorView | null;

  let requireDiff = $derived(propose !== "");

  $effect(() => {
    if (view instanceof MergeView) {
      propose;
      content;

      view.b.dispatch({
        changes: { from: 0, to: view.b.state.doc.length, insert: propose }
      });

      // original (left) pane
      view.a.dispatch({
        changes: { from: 0, to: view.a.state.doc.length, insert: content }
      });

    } else if (view instanceof EditorView) {
      content;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content }
      });
      
    }
  });

  $effect(() => {
    requireDiff;
    
    // destroy previous view
    view?.destroy();
    view = null;

    // wait until the DOM node is rendered
    queueMicrotask(() => {
      const extensions = [
        basicSetup,
        lang(), // Language extension
        EditorView.theme({}, { dark: theme === 'dark' }),
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(readOnly),
        EditorView.updateListener.of((up) => {
          if (up.docChanged) {
            const newContent = up.state.doc.toString();
            if (!requireDiff) {
              content = newContent;
            } else {
              propose = newContent;
            }
            onChange();
          }
        }),
        ...(lineWrapping ? [EditorView.lineWrapping] : [])
      ];

      if (!requireDiff) {
        view = new EditorView({
          parent: container,
          doc: content,
          extensions,
        });
      } else {
        view = new MergeView({
          parent: container,
          a: {
            doc: content,
            extensions: [
              basicSetup,
              lang(),
              ...(lineWrapping ? [EditorView.lineWrapping] : []),
              EditorView.theme({}, { dark: theme === 'dark' }),
            ],
          },
          b: {
            doc: propose,
            extensions: [
              basicSetup,
              lang(),
              ...(lineWrapping ? [EditorView.lineWrapping] : []),
              EditorView.theme({}, { dark: theme === 'dark' }),
              EditorView.editable.of(!readOnly),
              EditorState.readOnly.of(readOnly),
              EditorView.updateListener.of((up) => {
                if (up.docChanged) {
                  propose = up.state.doc.toString();
                  onChange();
                }
              }),
            ],
          },
        });
      }
    });
  });
</script>

<div bind:this={container} class="{klass} w-full h-full"></div>