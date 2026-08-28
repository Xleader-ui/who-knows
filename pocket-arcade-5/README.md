# Chat

A minimal AI chat app for iOS, styled like a standard chat client. Point it
at any OpenAI-compatible API (OpenRouter, direct OpenAI, Groq, Together,
Mistral, DeepSeek, and more), manage models and keys by editing one file,
and — optionally — edit the app's own code right on your iPhone via the
Files app. Built with plain HTML5/JS, wrapped as a native iOS app with
Capacitor.

## Play it instantly (no build needed)
Open `www/index.html` in Safari on your iPhone right now — it already works
for chat. (The Files-app editing and code-backup features below only work
in the installed app, not in Safari.)

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

Replace the placeholder keys with your real ones before building. List more
than one key and the app rotates between them every message, skipping to
the next one automatically on a 429/401/403 — useful for stretching several
free-tier keys further.

Set `type: 'embedding'` on an entry to route it to `POST {apiBase}/embeddings`
instead of chat completions — the app will show the returned vector's
dimensions and first few values rather than treating it as a conversation.
Works with OpenRouter's embedding models (e.g. `openai/text-embedding-3-small`)
as well as direct OpenAI, Cloudflare Workers AI, and other OpenAI-compatible
embedding endpoints.

To remove a model, delete its whole block. To add one, copy a block and
change the values.

## A note on keys in this file
Since keys live directly in `models.config.js`, don't push this file to a
**public** GitHub repo with real keys filled in — keep the repo private, or
keep placeholders in version control and fill in real keys only in the
copy you actually build from.

## Local Learner
A small, honest experiment: a statistical language model (a trigram Markov
chain, not a neural network) that trains entirely on your iPhone's CPU from
the text of your own conversations. It's genuinely on-device and instant,
but nowhere near the capability of the cloud models — think "picks up on
your texting patterns," not "learns to reason." Toggle it on/off from
Settings, where you can also see its stats or sample a short generated
continuation. Its learned data lives in local storage only.

## Editing the code on your iPhone
The app keeps an editable copy of its own source in Files → On My iPhone →
Chat → www, and serves the running app from there instead of the read-only
copy baked into the `.ipa`. Browse to `models.config.js`, `chat.js`,
`settings.js`, `local-learner.js`, `index.html`, or `style.css` and edit
directly on-device.

The stock Files app can browse and move these files but isn't a code
editor — to actually type changes you'll want an editor that supports
"Open in Place," like the free **Code App** (thebaselab) or **Textastic**.
Changes take effect the next time you relaunch the app.

**If the app itself won't load** (bad enough edit that nothing renders),
there's a small circular button in the bottom-right corner of the screen.
It's native UI sitting outside the web view entirely, so it keeps working
even when the code is completely broken. Press it, confirm, and it restores
the app's original files, undoing any edits.

## Honesty about the native (Swift) parts
The Documents-editing and reset-button features required a small amount of
hand-written Swift in `ios/App/App/SceneDelegate.swift` — plain UIKit and
FileManager only, no third-party plugin dependency. An earlier version of
this tried using Capacitor's official Filesystem plugin for a more granular
JS-driven backup system, but that plugin's current release has a genuine
bug (calls an API signature that no longer exists in current Capacitor
core) and fails to compile — confirmed against its source directly, not a
guess. That's been removed rather than fought with. If you want that
plugin back once it's fixed upstream, it's a clean re-add.

The SceneDelegate code here has been checked for syntax and matches the
exact same shape as an earlier version that's already built successfully
in this repo's Actions history, so it's on solid footing — but this build
environment still can't compile Swift directly, so nothing here has been
verified end-to-end on a real device. If something misbehaves after
building, tell me exactly what happened.
