// ============================================================================
// MODELS — edit this file to add, remove, or change which AI models show up
// in the switcher at the top of the chat. Your API keys go directly here —
// nothing is entered in the app itself. Save the file, rebuild the app (or
// just reload if you're testing in Safari) to see changes.
//
// Each entry needs:
//   id       — a short unique id, no spaces (used internally, never shown)
//   label    — the name shown in the app's model picker
//   apiBase  — the API's base URL, including any version path
//   model    — the exact model name/slug that API expects
//   keys     — an array of one or more API keys. If you list more than one,
//              the app rotates between them on every message, and
//              automatically skips to the next one if a request comes back
//              rate-limited (429) or unauthorized — handy for stretching
//              multiple free-tier keys further.
//
// This works with any API that speaks the OpenAI-style "chat completions"
// format at POST {apiBase}/chat/completions — which covers most providers:
// OpenRouter, OpenAI, Groq, Together, Mistral, DeepSeek, Fireworks, and
// more. Native Anthropic (api.anthropic.com) and native Google Gemini APIs
// use a different request format and won't work by just changing apiBase —
// route those through OpenRouter instead, which normalizes them.
//
// To remove a model, delete its whole { ... } block. To add one, copy a
// block and change the values.
// ============================================================================

window.MODELS = [
  {
    id: 'gpt4o-mini',
    label: 'GPT-4o mini',
    apiBase: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4o-mini',
    keys: [
      'sk-or-v1-REPLACE_WITH_YOUR_KEY',
    ],
  },
  {
    id: 'claude-sonnet',
    label: 'Claude 3.5 Sonnet',
    apiBase: 'https://openrouter.ai/api/v1',
    model: 'anthropic/claude-3.5-sonnet',
    keys: [
      'sk-or-v1-REPLACE_WITH_YOUR_KEY',
    ],
  },
  {
    id: 'gemini-flash',
    label: 'Gemini 2.0 Flash',
    apiBase: 'https://openrouter.ai/api/v1',
    model: 'google/gemini-2.0-flash-exp',
    keys: [
      'sk-or-v1-REPLACE_WITH_YOUR_KEY',
    ],
  },
  {
    id: 'llama-70b',
    label: 'Llama 3.3 70B',
    apiBase: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct',
    keys: [
      'sk-or-v1-REPLACE_WITH_YOUR_KEY',
      // add a second, third, etc. free-tier key here to rotate between them
    ],
  },

  // Example of routing a model through a totally different API instead of
  // OpenRouter — direct OpenAI, its own separate key:
  // {
  //   id: 'openai-direct-gpt4o',
  //   label: 'GPT-4o (direct OpenAI)',
  //   apiBase: 'https://api.openai.com/v1',
  //   model: 'gpt-4o',
  //   keys: ['sk-REPLACE_WITH_YOUR_OPENAI_KEY'],
  // },
];
