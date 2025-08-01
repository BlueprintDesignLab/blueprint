<!-- src/routes/settings/SettingsPage.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { nanoid } from 'nanoid'; // Make sure to install: npm install nanoid
  import {Label} from "$lib/components/ui/label/index";
  import {Input} from "$lib/components/ui/input/index";
  import {Button} from "$lib/components/ui/button/index";
  import * as Select from "$lib/components/ui/select/index.js";
  import { RadioGroup, RadioGroupItem } from "$lib/components/ui/radio-group/index.js";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
  import { toast } from "svelte-sonner";
  import { Info } from "lucide-svelte";

  import { settingsStore } from "$lib/state/tauriStores";
  import type { LlmSettings, ProviderConfig, SdkType } from "$lib/types/llm";
  import { DEFAULT_LLM_SETTINGS, BUILTIN_PROVIDERS, SDK_TYPES, createProviderConfig, getAvailableSdkTypes, getSuggestedModels } from "$lib/types/llm";

  // --- State Management ---
  let llmSettings = $state<LlmSettings>(DEFAULT_LLM_SETTINGS);
  let isAddingCustom = $state(false);
  let newCustomProviderName = $state('');
  let newCustomProviderUrl = $state('');

  // Derived state for easier access
  let selectedProvider = $derived(llmSettings.providers[llmSettings.selectedProviderId] || null);

  // --- Lifecycle ---
  onMount(async () => {
    await loadSettings();
  });

  // --- Functions ---
  const loadSettings = async () => {
    try {
      const storedSettings = await settingsStore.get('llm');
      if (storedSettings && typeof storedSettings === 'object') {
        // Basic validation could be added here
        llmSettings = { ...DEFAULT_LLM_SETTINGS, ...storedSettings };
        // Ensure built-in providers have default structure if missing
        Object.entries(BUILTIN_PROVIDERS).forEach(([id, config]) => {
            if (!llmSettings.providers[id]) {
                llmSettings.providers[id] = createProviderConfig(config);
            }
        });
      }
    } catch (err) {
      console.error("Failed to load LLM settings:", err);
      toast.error("Failed to load LLM settings.");
    }
  };

  const saveSettings = async () => {
    try {
      // Basic validation could be added here (e.g., check if selected provider exists)
      await settingsStore.set('llm', llmSettings);
      toast.success("LLM Settings Saved");
    } catch (err) {
      console.error("Failed to save LLM settings:", err);
      toast.error("Failed to save LLM settings.");
    }
  };

  const handleProviderChange = (providerId: string) => {
    if (providerId === 'custom-add') {
      isAddingCustom = true;
      newCustomProviderName = '';
      newCustomProviderUrl = '';
    } else {
      llmSettings.selectedProviderId = providerId;
      isAddingCustom = false; // Ensure custom form is hidden if switching away
    }
  };

  const handleAddCustomProvider = () => {
    const trimmedName = newCustomProviderName.trim();
    const trimmedUrl = newCustomProviderUrl.trim();

    if (!trimmedName || !trimmedUrl) {
      toast.error("Please enter both name and URL for the custom provider.");
      return;
    }

    // Check for name clashes with built-in providers
    if (BUILTIN_PROVIDERS[trimmedName.toLowerCase()]) {
       toast.error(`Name "${trimmedName}" clashes with a built-in provider.`);
       return;
    }

    // Check for name clashes with existing custom providers (by name)
    const nameExists = Object.values(llmSettings.providers).some(
      p => p.type === 'custom' && p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) {
       toast.error(`A custom provider with name "${trimmedName}" already exists.`);
       return;
    }

    const newId = `custom-${nanoid()}`; // Generate unique ID
    const newProvider: ProviderConfig = createProviderConfig(
      { id: newId, name: trimmedName, type: 'custom', baseUrl: trimmedUrl },
      { apiKey: '', sdkType: 'chat_completion' } // Set initial defaults for new custom provider
    );

    llmSettings.providers[newId] = newProvider;
    llmSettings.selectedProviderId = newId; // Select the newly added provider
    isAddingCustom = false; // Hide the form
    saveSettings();
    toast.success(`Custom provider "${trimmedName}" added.`);
  };

  const handleCancelAddCustom = () => {
    isAddingCustom = false;
  };

  const updateSelectedProviderField = <K extends keyof ProviderConfig>(field: K, value: ProviderConfig[K]) => {
    if (selectedProvider) {
      llmSettings.providers[selectedProvider.id] = {
        ...selectedProvider,
        [field]: value,
      };
    }
  };

  const handleDeleteCustomProvider = (providerId: string) => {
    const providerToDelete = llmSettings.providers[providerId];
    if (providerToDelete?.type === 'custom') {
      const providerName = providerToDelete.name;
      delete llmSettings.providers[providerId];

      // If the deleted provider was selected, switch to default (OpenAI)
      if (llmSettings.selectedProviderId === providerId) {
         llmSettings.selectedProviderId = 'openai';
      }
      toast.success(`Custom provider "${providerName}" deleted.`);
    }
  };

  let suggestedModelsForSelected = $derived(selectedProvider ? getSuggestedModels(selectedProvider.id) : []);
</script>

<div class="flex flex-col gap-6 p-6">
  <Card>
    <CardContent class="space-y-4">
      <div class="space-y-2">
        <Label for="provider-select">Provider</Label>
        <Select.Root
          type="single"
          value={isAddingCustom ? 'custom-add' : llmSettings.selectedProviderId}
          onValueChange={handleProviderChange}
        >
          <Select.Trigger class="w-full">
            {selectedProvider.name
              ? selectedProvider.name
              : "Select a provider"} 
          </Select.Trigger>
          <Select.Content>
            {#each Object.values(llmSettings.providers) as provider (provider.id)}
              <Select.Item value={provider.id}>{provider.name}</Select.Item>
            {/each}
            <Select.Item value="custom-add">+ Add Custom Provider</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>

      <!-- Custom Provider Form -->
      {#if isAddingCustom}
        <div class="space-y-4 p-4 border rounded-lg bg-muted">
          <h3 class="font-medium">Add New Custom Provider</h3>
          <div class="space-y-2">
            <Label for="custom-name">Provider Name</Label>
            <Input
              id="custom-name"
              bind:value={newCustomProviderName}
              placeholder="e.g., My Local LLM"
            />
          </div>
          <div class="space-y-2">
            <Label for="custom-url">Base API URL</Label>
            <Input
              id="custom-url"
              bind:value={newCustomProviderUrl}
              placeholder="e.g., http://localhost:8000/v1"
            />
          </div>
          <div class="flex justify-end space-x-2">
            <Button variant="outline" onclick={handleCancelAddCustom}>Cancel</Button>
            <Button onclick={handleAddCustomProvider}>Add Provider</Button>
          </div>
        </div>
      {/if}

      <!-- Selected Provider Settings -->
      {#if selectedProvider && !isAddingCustom}
        <div class="space-y-4 pt-4">
           <div class="flex items-center justify-between">
             <h3 class="text-lg font-medium">{selectedProvider.name} Settings</h3>
             {#if selectedProvider.type === 'custom'}
               <Button
                 variant="destructive"
                 size="sm"
                 onclick={() => handleDeleteCustomProvider(selectedProvider.id)}
               >
                 Delete
               </Button>
             {/if}
           </div>

          <div class="space-y-2">
            <Label for={`base-url-${selectedProvider.id}`}>Base API URL</Label>
            <Input
              id={`base-url-${selectedProvider.id}`}
              bind:value={selectedProvider.baseUrl}
              disabled={selectedProvider.type === 'builtin'}
              placeholder="Base URL"
            />
            {#if selectedProvider.type === 'builtin'}
              <p class="text-sm text-muted-foreground">Built-in provider URL (cannot be changed).</p>
            {/if}
          </div>

          <div class="space-y-2">
            <Label for={`sdk-type-${selectedProvider.id}`}>API Type</Label>
            <RadioGroup
              id={`sdk-type-${selectedProvider.id}`}
              value={selectedProvider.sdkType}
              onValueChange={(val) => updateSelectedProviderField('sdkType', val as SdkType)}
            >
              {#each getAvailableSdkTypes(selectedProvider.id) as sdkTypeOption}
                <div class="flex items-center space-x-2">
                  <RadioGroupItem
                    id={`sdk-type-${selectedProvider.id}-${sdkTypeOption}`}
                    value={sdkTypeOption}
                  />
                  <Label for={`sdk-type-${selectedProvider.id}-${sdkTypeOption}`}>
                    {SDK_TYPES.find(t => t.value === sdkTypeOption)?.label || sdkTypeOption}
                  </Label>
                </div>
              {/each}
            </RadioGroup>
          </div>

          <div class="space-y-2">
            <Label for={`model-${selectedProvider.id}`}>Model</Label>
            {#if suggestedModelsForSelected.length > 0}
              <!-- If there are suggested models, show a Select dropdown -->
              <Select.Root
                 type="single"
                 value={selectedProvider.selectedModel}
                 onValueChange={(val) => updateSelectedProviderField('selectedModel', val)}
              >
                 <Select.Trigger id={`model-${selectedProvider.id}`} class="w-full">
                   {selectedProvider.selectedModel || "Select a model"}
                 </Select.Trigger>
                 <Select.Content>
                   {#each suggestedModelsForSelected as model}
                     <Select.Item value={model}>{model}</Select.Item>
                   {/each}
                 </Select.Content>
              </Select.Root>
            {:else}
              <!-- If no suggested models, show a simple Input textbox -->
              <Input
                id={`model-${selectedProvider.id}`}
                bind:value={selectedProvider.selectedModel}
                placeholder="Enter model name (e.g., gpt-4o, claude-3-5-sonnet-latest)"
              />
            {/if}
            <p class="text-sm text-muted-foreground">
              {#if selectedProvider.type === 'builtin'}
                 Select a model from the list or enter a custom one.
              {:else}
                 Enter the name of the model provided by your custom endpoint.
              {/if}
            </p>
          </div>

          <div class="space-y-2">
            <Label for={`api-key-${selectedProvider.id}`}>API Key</Label>
            <Input
              id={`api-key-${selectedProvider.id}`}
              type="password"
              bind:value={selectedProvider.apiKey}
              placeholder="API Key"
            />
          </div>
        </div>
      {:else if !isAddingCustom}
         <p class="text-muted-foreground">Please select a provider or add a custom one.</p>
      {/if}
    </CardContent>
  </Card>

  <div class="flex items-start gap-2 text-sm text-muted-foreground">
    <Info size={16} class="mt-0.5 shrink-0" />
    <span>
      Select from major providers or add any OpenAI-compatible endpoint.
      The API key is stored locally on your device.
    </span>
  </div>

  <Button onclick={saveSettings} class="self-start">Save Settings</Button>
</div>

<style>
  /* Add any specific styles if needed */
</style>