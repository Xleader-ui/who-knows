window.Settings = (function () {
  const SETTINGS_KEY = 'chat_settings_v1';

  function loadSettings() {
    try { return Object.assign({ animations: true }, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); }
    catch (e) { return { animations: true }; }
  }
  function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

  function applyAnimationSetting() {
    const s = loadSettings();
    document.body.classList.toggle('no-animations', !s.animations);
  }

  function render() {
    const overlay = document.querySelector('.settings-overlay');
    const s = loadSettings();
    const learnerStats = window.LocalLearner ? window.LocalLearner.stats() : { patterns: 0, observations: 0 };
    const learnerEnabled = window.LocalLearner ? window.LocalLearner.isEnabled() : false;

    overlay.querySelector('.settings-body').innerHTML = `
      <div class="settings-section">
        <div class="settings-section-title">Appearance</div>
        <div class="settings-row">
          <span>Animations</span>
          <label class="switch">
            <input type="checkbox" class="animations-toggle" ${s.animations ? 'checked' : ''} />
            <span class="switch-track"></span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Local Learner</div>
        <p class="settings-desc">Trains a small statistical model on your CPU from your own chat text. Not a neural network, nowhere near the cloud models — just picks up on word patterns as you chat.</p>
        <div class="settings-row">
          <span>Enabled</span>
          <label class="switch">
            <input type="checkbox" class="learner-toggle" ${learnerEnabled ? 'checked' : ''} />
            <span class="switch-track"></span>
          </label>
        </div>
        <div class="settings-stat">${learnerStats.patterns} patterns learned · ${learnerStats.observations} observations</div>
        <div class="settings-btn-row">
          <input class="learner-seed-input" placeholder="Seed words (optional)" />
          <button class="settings-btn learner-generate-btn">Generate</button>
        </div>
        <div class="settings-output learner-output"></div>
        <button class="settings-btn ghost learner-reset-btn">Clear learned data</button>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Code editing</div>
        <p class="settings-desc">Edit the app's code via Files → On My iPhone → Chat → www. If an edit breaks something, use the small reset button in the bottom-right corner of the home screen — it's native, so it works even if the code itself is broken.</p>
      </div>
    `;

    overlay.querySelector('.animations-toggle').addEventListener('change', (e) => {
      const settings = loadSettings();
      settings.animations = e.target.checked;
      saveSettings(settings);
      applyAnimationSetting();
    });

    if (window.LocalLearner) {
      overlay.querySelector('.learner-toggle').addEventListener('change', (e) => {
        window.LocalLearner.setEnabled(e.target.checked);
      });
      overlay.querySelector('.learner-generate-btn').addEventListener('click', () => {
        const seed = overlay.querySelector('.learner-seed-input').value;
        overlay.querySelector('.learner-output').textContent = window.LocalLearner.generate(seed, 24);
      });
      overlay.querySelector('.learner-reset-btn').addEventListener('click', () => {
        window.LocalLearner.reset();
        render();
      });
    }
  }

  function open() {
    render();
    document.querySelector('.settings-overlay').classList.remove('hidden');
  }
  function close() {
    document.querySelector('.settings-overlay').classList.add('hidden');
  }

  applyAnimationSetting();

  return { open, close };
})();
