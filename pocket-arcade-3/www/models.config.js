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
    id: 'lfm-2.5-embedding-350m',
    label: 'lfm-2.5-embedding-350m',
    apiBase: 'https://openrouter.ai/api/v1',
    model: 'liquid/lfm-2.5-embedding-350m:free',
    keys: [
      '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',
      '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',
    ],
  },
  {
    id: 'nemotron-3.5-lightning',
    label: 'nemotron-3.5-lightning',
    apiBase: 'https://openrouter.ai/api/v1',
    model: 'nvidia/nemotron-3.5-lightning:free',
    keys: [
      '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',
      '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',
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
