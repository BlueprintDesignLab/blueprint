// src/lib/utils/llmClient.ts (or similar)
import OpenAI from 'openai';
// import Anthropic from '@anthropic-ai/sdk'; // Uncomment when adding Anthropic
// import { GoogleGenAI } from "@google/genai";

import { settingsStore } from '$lib/state/tauriStores';

import type { LLMClient } from './LLMClient';
import { OpenAICompletionsLLMClient } from './OpenaiCompletionLLMClient';
import { DEFAULT_LLM_SETTINGS, type LlmSettings, type ProviderConfig } from '$lib/types/llm';
import Anthropic from '@anthropic-ai/sdk';
import { AnthropicLLMClient } from './AnthropicLLMClient';

/**
 * Loads the current LLM settings and instantiates the appropriate client.
 * @returns A promise that resolves to the instantiated client object, or null if configuration is missing/invalid.
 */
export async function getCurrLLMClient(): Promise<LLMClient | null> { // Adjust return type union when adding more clients
  try {
    // 1. Load the entire 'llm' settings object
    const llmSettingsRaw = await settingsStore.get('llm');

    // 2. Type guard and merge with defaults for safety
    let llmSettings: LlmSettings;
    if (llmSettingsRaw && typeof llmSettingsRaw === 'object' && 'providers' in llmSettingsRaw && 'selectedProviderId' in llmSettingsRaw) {
      // @ts-ignore Merge with defaults to ensure structure, but prefer loaded values 
      llmSettings = {
        ...DEFAULT_LLM_SETTINGS,
        ...llmSettingsRaw,
        providers: {
          ...DEFAULT_LLM_SETTINGS.providers,
          ...llmSettingsRaw.providers ?? [],
        },
      };
    } else {
      console.warn("LLM settings not found or invalid, using defaults.");
      llmSettings = DEFAULT_LLM_SETTINGS;
    }

    // 3. Get the configuration for the selected provider
    const selectedProviderId = llmSettings.selectedProviderId;
    const selectedProvider: ProviderConfig | undefined = llmSettings.providers[selectedProviderId];


    if (!selectedProvider) {
      console.error(`Selected provider '${selectedProviderId}' or configuration not found.`);
      return null;
    }

    const { baseUrl, apiKey, sdkType, selectedModel } = selectedProvider;

    // 4. Validate essential configuration
    if (!baseUrl || !apiKey) {
        console.error(`Base URL or API Key missing for provider '${selectedProvider.name}'.`);
        // Optionally, you could throw an error here instead
        return null;
    }

    switch (sdkType) {
      case 'chat_completion':
        // Handles OpenAI and any custom provider configured for OpenAI compatibility
        const openaiClient = new OpenAI({
          baseURL: baseUrl,
          apiKey: apiKey,
          dangerouslyAllowBrowser: true, // Required for browser usage in Tauri
        });
        return new OpenAICompletionsLLMClient(openaiClient, selectedModel);

      case 'messages':
        // Handles Anthropic and any custom provider configured for Anthropic compatibility
        const anthropicClient = new Anthropic({
          baseURL: baseUrl, // Anthropic SDK supports baseURL
          apiKey: apiKey,
          dangerouslyAllowBrowser: true,
        });
        return new AnthropicLLMClient(anthropicClient, selectedModel);

      default:
        console.error(`Unsupported SDK type '${sdkType}' for provider '${selectedProvider.name}'.`);
        return null;
    }

  } catch (error) {
    console.error("Error loading LLM settings or initializing provider:", error);
    return null;
  }
}