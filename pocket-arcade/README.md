# Star Dodger

A tiny arcade dodger: drag to steer your ship left/right, weave through
falling rocks, and rack up points — bonus score for close near-misses.
Built with plain HTML5 Canvas, wrapped as a native iOS app with Capacitor.

## Play it instantly (no build needed)
Open `www/index.html` in Safari on your iPhone right now — it already works
as a game. You can even tap Share → "Add to Home Screen" to get an app icon
and full-screen play, no sideloading required.

## Get a real .ipa to sideload with iLoader
Compiling for iOS requires Apple's toolchain, which only runs on a Mac.
Since you likely don't have one, this repo includes a free GitHub Actions
workflow that builds the `.ipa` for you on GitHub's own macOS runners:

1. Create a new GitHub repo (public or private) and push this whole folder
   to it:
   ```bash
   git init
   git add .
   git commit -m "Star Dodger"
   git branch -M main
   git remote add origin https://github.com/<you>/star-dodger.git
   git push -u origin main
   ```
2. On GitHub, go to the **Actions** tab of your new repo. The
   "Build Star Dodger IPA" workflow will run automatically on push (or click
   **Run workflow** to trigger it manually).
3. Wait for the run to finish (a few minutes). Open the completed run and
   download the **StarDodger-ipa** artifact — that's a zip containing
   `StarDodger.ipa`.
4. Open iLoader on your iPhone 11, pick that `.ipa`, sign in with your Apple
   ID (this is the step that actually signs the app — the build from GitHub
   is intentionally unsigned), and install.
5. First launch: go to Settings → General → VPN & Device Management and
   trust the developer profile, same as any free sideloaded app.

Free Apple ID sideloaded apps re-sign every 7 days, so you'll periodically
need to reinstall through iLoader — that's an Apple limitation, not
something specific to this game.

## Changing the game
All the game logic lives in `www/games/*.js`, `www/index.html` (screens),
and `www/style.css` (look). Edit those, push again — the Action rebuilds the
ipa automatically.

## Editing the code right on your iPhone
The app now keeps a working copy of its own source files in
Files → On My iPhone → Pocket Arcade, and loads the game from there instead
of the read-only copy baked into the app. You can browse to
`www/index.html`, `www/style.css`, and `www/games/*.js` and edit them
directly on-device.

The stock Files app can browse, rename, and move these files, but it isn't
a code editor — to actually type changes into them you'll need a text/code
editor app that supports "Open in Place" on iOS, for example the free
**Code App** (thebaselab) or **Textastic**. Open the editor, browse to
On My iPhone → Pocket Arcade → www, and edit away. Changes take effect the
next time you relaunch the app (or force-quit and reopen it).

If an edit breaks something, there's a small circular button in the
bottom-right corner of the home screen — it lives outside the web view, so
it keeps working even if the game code is completely broken. Press and hold
it for about a second, confirm, and it restores the original files from the
app bundle. Your high scores aren't affected, since those are stored
separately from the game code.
