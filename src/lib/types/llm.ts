// src/lib/types/llm.ts

export type SdkType = 'chat_completion' | 'messages' | 'chat';

export interface ProviderConfig {
  id: string; // Unique ID (builtin name or UUID for custom)
  name: string; // Display name
  type: 'builtin' | 'custom';
  baseUrl: string;
  apiKey: string;
  sdkType: SdkType;
  // --- Added for Model Selection ---
  selectedModel: string; // Stores the currently selected or entered model name
}

export interface LlmSettings {
  selectedProviderId: string;
  providers: Record<string, ProviderConfig>;
}

// --- Define Known Models for Built-in Providers ---
// This is a simple mapping from provider ID to a list of common model names.
// In a more advanced setup, you might fetch this dynamically or have a more complex structure.
// --- Latest Production-ready Models (as of 2025-08-01) ---
export const BUILTIN_MODELS: Record<string, string[]> = {
  openai: [
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'gpt-4o',
    'gpt-4o-mini',
    'o3',
    'o4-mini',
  ],
  anthropic: [
    'claude-opus-4-20250514',   // claude-opus-4-latest
    'claude-sonnet-4-20250514', // claude-sonnet-4-latest
    'claude-3-7-sonnet-20250219', // claude-3-7-sonnet-latest
    'claude-3-5-sonnet-20241022', // claude-3-5-sonnet-latest
    'claude-3-5-haiku-20241022',  // claude-3-5-haiku-latest
  ],
  google: [
    'gemini-2.5-pro',  // gemini-2.5-pro-latest
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ],
};

// Default configurations for built-in providers
export const BUILTIN_PROVIDERS: Record<string, Omit<ProviderConfig, 'apiKey' | 'sdkType' | 'selectedModel'>> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    type: 'builtin',
    baseUrl: 'https://api.openai.com/v1', // Removed trailing spaces
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'builtin',
    baseUrl: 'https://api.anthropic.com', // Removed trailing spaces, confirmed standard
  },
  google: {
    id: 'google',
    name: 'Google',
    type: 'builtin',
    baseUrl: 'https://generativelanguage.googleapis.com', // Removed trailing spaces, confirmed standard
  },
};

// Available SDK Types for selection
export const SDK_TYPES: { value: SdkType; label: string }[] = [
  { value: 'chat_completion', label: 'OpenAI Chat Completion (Compatible with most providers)' },
  { value: 'messages', label: 'Anthropic Messages (Compatible with Anthropic)' },
  // { value: 'chat', label: 'Chat (Google Compatible)' }, // Re-enabled as per original plan
];

// Helper to create a full ProviderConfig from defaults
export function createProviderConfig(
  baseConfig: Omit<ProviderConfig, 'apiKey' | 'sdkType' | 'selectedModel'>,
  overrides: Partial<ProviderConfig> = {}
): ProviderConfig {
  // Determine a default model based on provider type or BUILTIN_MODELS if available
  let defaultModel = '';
  if (baseConfig.id && BUILTIN_MODELS[baseConfig.id] && BUILTIN_MODELS[baseConfig.id].length > 0) {
    defaultModel = BUILTIN_MODELS[baseConfig.id][0]; // Pick the first as default
  } else if (baseConfig.id === 'openai') {
    defaultModel = 'gpt-4.1'; // Fallback default for OpenAI
  } else if (baseConfig.id === 'anthropic') {
    defaultModel = 'claude-sonnet-4-20250514'; // Fallback default for Anthropic
  } else if (baseConfig.id === 'google') {
    defaultModel = 'gemini-2.5-pro'; // Fallback default for Google
  }
  // For truly custom providers, defaultModel remains empty '', requiring user input

  return {
    ...baseConfig,
    apiKey: '',
    sdkType: 'chat_completion', // Default SDK type
    selectedModel: defaultModel, // Set the default model
    ...overrides,
  };
}

// Helper to get available SDK types for a given provider ID
// (Keeping this flexible as per your original requirement)
export function getAvailableSdkTypes(providerId: string): SdkType[] {
  return ['chat_completion', 'messages'];
}

// Helper to get suggested models for a given provider ID
export function getSuggestedModels(providerId: string): string[] {
  return BUILTIN_MODELS[providerId] || [];
}


// Default initial state
export const DEFAULT_LLM_SETTINGS: LlmSettings = {
  selectedProviderId: 'openai',
  providers: Object.fromEntries(
    Object.entries(BUILTIN_PROVIDERS).map(([id, config]) => [
      id,
      createProviderConfig(config), // This will now include selectedModel
    ])
  ),
};
