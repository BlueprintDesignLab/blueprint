<script lang="ts">
  import OpenAI from "openai";
  import { type ResponseCreateParamsBase, type ResponseInput } from "openai/resources/responses/responses.mjs";
  import { PUBLIC_OPENAI} from "$env/static/public";
  import Input from "$lib/components/ui/input/input.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  // import { architectTools } from "$lib/llm/tools";
  import { architect } from "$lib/llm/prompt";
  import MdRenderer from "./MDRenderer.svelte";
  import type { ToolCall } from "openai/resources/beta/threads/runs/steps.mjs";

  import { invoke } from '@tauri-apps/api/core';
  import { coderTools } from "$lib/llm/tools";

  const openai = new OpenAI({
    apiKey: PUBLIC_OPENAI,
    dangerouslyAllowBrowser: true
  });

  let ch: any = $state([]);
  let chDiv: HTMLDivElement | null = $state(null);

  let question = $state("");

  $effect.pre(() => {
    if (!ch[ch.length - 1]?.content) return;
    for (const res of ch[ch.length - 1].responses) {
      res.content;
    }

    if (!chDiv) return;

    const autoscroll =
      chDiv.offsetHeight + chDiv.scrollTop > chDiv.scrollHeight - 50;

    if (autoscroll) {
      tick().then(() => {
        // @ts-ignore
        chDiv.scrollTo(0, chDiv.scrollHeight);
      });
    }
  });


  async function processToolCall(toolCall: any, responseRender: any) {
    if (toolCall.type !== "function_call") {
      return;
    }

    const name = toolCall.name;
    const args = JSON.parse(toolCall.arguments);

    let result = "";

    responseRender.content += `${name}`;
    result = await invoke(name, args);

    // switch(name) {
    //   case "read_file":
    //     responseRender.content += `Reading file: ${args.path}`;
    //     result = await invoke(name, args);
    //     break;
    //   case "read_project":
    //     responseRender.content += `Scanning project`;
    //     result = await invoke(name, args);
    //     break;
    // }

    console.log(result);
    responseRender.content += "\nComplete";
    
    ch.push({
      type: "function_call_output",
      call_id: toolCall.call_id,
      output: result.toString()
    });
  }

  async function streamToCH(stream: any, responseRender: any) {
    for await (const event of stream) {
      switch (event.type) {
        case "response.output_text.delta":
        //   console.log(event.delta);
          responseRender.content += event.delta;
          break;

        case "response.output_item.done":
          const toolCall = event.item;
          console.log(toolCall);
          ch.push(toolCall);

          processToolCall(toolCall, responseRender);
          break;
        
        case "response.created":
          // console.log(event.response.id);
          // previous_response_id = event.response.id;
          break;
        case "response.web_search_call.in_progress":
          console.log(event);
          break;
      }
    }
  }

  const send = async () => {
    ch.push({
      role: "user",
      content: question
    });
    question = "";

    const stream = await openai.responses.create({
      model: "gpt-4.1",
      input: ch,
      stream: true,
      // tools: [ { type: "web_search_preview" } ].push(...coderTools),
      tools: coderTools,
      instructions: architect
    });

    const responseRender = $state({
      role: "assistant",
      content: ""
    })

    ch.push(responseRender);

    streamToCH(stream, responseRender);
  };

  export function handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "Enter":
          if (!event.shiftKey) {
            event.preventDefault(); // Prevent the default Enter behavior (newline)
            send();
          }
          // If Shift is held, do nothing special: the default behavior will insert a newline
          if (event.shiftKey) {
            event.preventDefault(); // Prevent the default Enter behavior (newline)
            send();
          }
        break;
    }
  }
</script>


<div class="flex flex-col h-screen max-w-xl mx-auto p-4">
  <div bind:this={chDiv} class="flex-1 overflow-auto space-y-2 p-2 bg-muted rounded-xl border">
    {#each ch as chItem, i}
      {#if chItem.role}
        {chItem.role}
        <div class="bg-background border rounded-lg p-3 shadow-sm">
          <MdRenderer content={chItem.content}/>
        </div>
      {/if}
    {/each}
  </div>

  <!-- Input area -->
  <div class="mt-4 flex items-center gap-2">
    <Input bind:value={question} onkeydown={(e) => handleKeyDown(e)} class="flex-1" placeholder="Type your message..."/>
    <Button onclick={send}>send</Button>
  </div>
</div>


