<!-- SettingsPage.svelte -->
<script lang="ts">
import Label from "../ui/label/label.svelte";
  import Input from "../ui/input/input.svelte";
  import Button from "../ui/button/button.svelte";

  import { Info } from "lucide-svelte";
  import { settingsStore } from "$lib/state/tauriStores";
  import { toast } from "svelte-sonner";
  
  // local state – replace with your store / api
  let endpoint = $state("https://api.openai.com/v1");
  let apiKey   = $state("");
  let modelName = $state("gpt-4.1");

  const loadInit = async () => {
    endpoint = await settingsStore.get('url-endpoint') ?? "https://api.openai.com/v1";
    apiKey = await settingsStore.get('api-key') ?? "";
    modelName = await settingsStore.get('model-name') ?? "gpt-4.1";
  };
  loadInit();

  function onSave() {
    settingsStore.set('api-key', apiKey.trim());
    settingsStore.set('url-endpoint', endpoint.trim());
    settingsStore.set('model-name', modelName.trim());

    toast.success("LLM Settings Saved");
  }
</script>

<div class="flex flex-col gap-6 p-6 max-w-md">
  <h2 class="text-xl font-semibold">API Settings</h2>

  <div class="space-y-2">
    <Label for="endpoint">Endpoint URL</Label>
    <Input
      id="endpoint"
      bind:value={endpoint}
      placeholder="https://api.openai.com/v1"
    />
  </div>

  <div class="space-y-2">
    <Label for="apiKey">API Key</Label>
    <Input
      id="apiKey"
      type="password"
      bind:value={apiKey}
      placeholder="sk-..."
    />
  </div>

  <div class="space-y-2">
    <Label for="endpoint">Model Name</Label>
    <Input
      id="endpoint"
      bind:value={modelName}
    />
  </div>

  <div class="flex items-start gap-2 text-sm text-muted-foreground">
    <Info size={16} class="mt-0.5 shrink-0" />
    <span>
      Only OpenAI chat completion compatible endpoints are supported.<br />
      Additional providers will be added soon!
    </span>
  </div>

  <Button onclick={onSave} class="self-start">Save</Button>
</div>