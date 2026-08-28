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
//   type     — optional, defaults to 'chat'. Set to 'embedding' for models
//              that only do embeddings — those get sent to
//              POST {apiBase}/embeddings instead of /chat/completions, and
//              the app shows you the vector's dimensions and first few
//              values rather than treating it as a conversation.
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
    id: 'nemotron-3.5-lightning',
    label: 'nemotron-3.5-lightning',
    apiBase: 'https://openrouter.ai/api/v1',
    model: 'nvidia/nemotron-3.5-lightning:free',
    keys: [
      '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',
      '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',
    ],
  },
  {
    id: 'lfm-2.5-2.6b',
    label: 'lfm-2.5-2.6b',
    apiBase: 'https://openrouter.ai/api/v1',
    model: 'liquid/lfm-2.5-2.6b:free',
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
