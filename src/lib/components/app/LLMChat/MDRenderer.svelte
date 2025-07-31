<script lang="ts">
  import { Marked } from "marked";
  import { markedHighlight } from "marked-highlight";

  import markedKatex from "marked-katex-extension";
  import hljs from "highlight.js";

  import { Copy, CopyCheck } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  import DOMPurify from 'dompurify';
  import { copyToClipboard } from "./clipboard";

  interface Props {
    content: string
  }

  let { content }: Props = $props();

  const marked = new Marked(
    markedHighlight({
      langPrefix: "hljs language-",
      /**
       * @param {string} code
       * @param {string} lang
       */
      // @ts-ignore
      highlight(code, lang, _) {
        if (lang === "svelte") {
          lang = "javascript";
        }

        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    })
  );

  const options = {
    throwOnError: false,
  };

  marked.use(markedKatex(options));

  let parsed: string = $derived.by(() => {
    // const replacedInline = replaceInlineDelimiters(content);
    // const replacedBlock = replaceBlockDelimiters(replacedInline);

    // @ts-ignore
    const parsed = marked.parse(content ?? "");
    return parsed;
  }) as string;

  // @ts-ignore
  let sections = $derived(splitCodeBlocks(parsed));

  function replaceBlockDelimiters(text: string) {
    const regex = /\\\[.*?\\\]/gs;
    const replaced = text.replace(regex, (match) => {
      return `\n\`\`\`tex\n${match}\n\`\`\`\n$$\n${match.slice(2, -2)}\n$$\n`;
    });
    return replaced;
  }

  function replaceInlineDelimiters(text: string) {
    const regex = /\\\(.*?\\\)/g;
    const replaced = text.replace(regex, (match) => {
      return `$${match.slice(2, -2)}$`;
    });
    return replaced;
  }


  function splitCodeBlocks(text: string) {
    const regex = /<pre[^>]*>[\s\S]*?<\/pre>/g;

    const nonCode = text.split(regex);
    const code = text.match(regex) ?? [];

    /**
     * @type {[string, string][]}
     */
    const newSections = [];

    for (let i = 0; i < nonCode.length; i++) {
      newSections.push(["text", nonCode[i]]);
      if (code[i]) {
        newSections.push(["code", code[i]]);
      }
    }

    return newSections;
  }

  function stripHtml(html: string) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  let copyButtonChecked = $state(-1);

  function copyToClipboardWrapper(rawHtml: string, index: number) {
    copyToClipboard(rawHtml);

    copyButtonChecked = index;
    setTimeout(() => (copyButtonChecked = -1), 3000);
  }
</script>
<!-- Whole response wrapper -->
<div class="space-y-6">

  {#if content === ""}
    <!-- “AI is thinking” placeholder -->
    <div class="w-40 mx-auto pt-6 text-center text-muted-foreground text-sm animate-pulse">
      AI is thinking…
    </div>
  {:else}
    <!-- Render each section -->
    {#each sections as section, i}
      {@const type = section[0]}
      {@const content = section[1]}

      <!-- {type} -->
      {#if type === "code"}
        <!-- Code block -->
        <div class="relative">
          <pre
            class="rounded-xl overflow-auto bg-zinc-900 text-zinc-100 py-3 pl-4 pr-14 font-mono text-sm shadow-sm border border-zinc-800"
          >{@html DOMPurify.sanitize(content)}</pre>

          <!-- Copy button anchored to the block -->
          <div class="absolute top-2.5 right-2">
            <Button
              size="icon"
              variant="secondary"
              onclick={() => copyToClipboardWrapper(content, i)}
            >
              {#if copyButtonChecked === i}
                <CopyCheck class="w-4 h-4 mr-1" />
              {:else}
                <Copy class="w-4 h-4 mr-1" />
              {/if}
            </Button>
          </div>
        </div>
      {:else}
        <!-- Regular markdown -->
        <article class="prose prose-neutral dark:prose-invert max-w-none">
          <span class="text-container" data-testid="responseContent">
            {@html DOMPurify.sanitize(content)}
          </span>
        </article>
      {/if}
    {/each}
  {/if}
</div>

