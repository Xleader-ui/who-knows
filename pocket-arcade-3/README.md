# Chat

A minimal AI chat app for iOS, styled like a standard chat client. Point it
at any OpenAI-compatible API (OpenRouter, direct OpenAI, Groq, Together,
Mistral, DeepSeek, and more), and manage which models and keys are
available by editing one plain-text file. Built with plain HTML5/JS,
wrapped as a native iOS app with Capacitor.

## Play it instantly (no build needed)
Open `www/index.html` in Safari on your iPhone right now — it already works.
Tap Share → "Add to Home Screen" for an app icon and full-screen use, no
sideloading required.

## Get a real .ipa to sideload with iLoader
Compiling for iOS requires a Mac. This repo includes a free GitHub Actions
workflow that builds the `.ipa` on GitHub's own macOS runners instead:

1. Push this whole folder to a GitHub repo.
2. Go to the **Actions** tab → "Build Star Dodger IPA" → **Run workflow**
   (or it runs automatically on push).
3. Once it finishes, open the run → **Artifacts** → download `StarDodger-ipa`
   → unzip to get `Chat.ipa`.
4. Open iLoader on your iPhone, select the `.ipa`, sign in with your Apple
   ID, and install. Trust the developer profile in Settings → General →
   VPN & Device Management on first launch.

Free Apple ID sideloaded apps re-sign every 7 days — that's an Apple
limitation, not specific to this app.

## Setting up your models and keys
Everything lives in `www/models.config.js` — it's heavily commented. Each
model entry has an API base URL, a model slug, and an array of keys right
in the file:

```js
{
  id: 'gpt4o-mini',
  label: 'GPT-4o mini',
  apiBase: 'https://openrouter.ai/api/v1',
  model: 'openai/gpt-4o-mini',
  keys: ['sk-or-v1-your-real-key-here'],
}
```

Replace the placeholder keys with your real ones before building. If you
list more than one key in the `keys` array, the app rotates between them on
every message and automatically skips to the next one if a request comes
back rate-limited — useful for stretching several free-tier keys further.

Works with any API that implements the standard OpenAI-style
`POST {apiBase}/chat/completions` endpoint, which covers most providers
today. Native Anthropic (`api.anthropic.com`) and native Google Gemini
endpoints use a different request format and won't work by just changing
`apiBase` — route those through OpenRouter instead, which normalizes them
into the OpenAI format.

To remove a model, delete its whole block. To add one, copy a block and
change the values.

## A note on keys in this file
Since keys live directly in `models.config.js`, don't push this file to a
**public** GitHub repo with real keys filled in — keep the repo private, or
keep the placeholders in version control and fill in real keys only in the
copy you actually build from.
