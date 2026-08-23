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
All the game logic lives in `www/game.js` (physics/spawning/scoring),
`www/index.html` (screens), and `www/style.css` (look). Edit those, then
push again — the Action rebuilds the ipa automatically.
