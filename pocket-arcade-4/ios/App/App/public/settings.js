window.Settings = (function () {
  const SETTINGS_KEY = 'chat_settings_v1';
  const BACKUP_META_KEY = 'chat_backup_meta_v1';

  function loadSettings() {
    try { return Object.assign({ animations: true }, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); }
    catch (e) { return { animations: true }; }
  }
  function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

  function applyAnimationSetting() {
    const s = loadSettings();
    document.body.classList.toggle('no-animations', !s.animations);
  }

  function fs() {
    return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) || null;
  }

  async function saveBackupNow(statusEl) {
    const Filesystem = fs();
    if (!Filesystem) return;
    statusEl.textContent = 'Saving backup…';
    try {
      try { await Filesystem.rmdir({ path: 'www-backup', directory: 'DOCUMENTS', recursive: true }); } catch (e) { /* didn't exist yet, fine */ }
      await Filesystem.copy({ from: 'www', to: 'www-backup', directory: 'DOCUMENTS', toDirectory: 'DOCUMENTS' });
      localStorage.setItem(BACKUP_META_KEY, JSON.stringify({ timestamp: Date.now() }));
      renderBackupStatus(statusEl);
    } catch (err) {
      statusEl.textContent = 'Backup failed: ' + err.message;
    }
  }

  async function restoreFrom(sourceDir, statusEl) {
    const Filesystem = fs();
    if (!Filesystem) return;
    statusEl.textContent = 'Restoring…';
    try {
      try { await Filesystem.rmdir({ path: 'www', directory: 'DOCUMENTS', recursive: true }); } catch (e) { /* ignore */ }
      await Filesystem.copy({ from: sourceDir, to: 'www', directory: 'DOCUMENTS', toDirectory: 'DOCUMENTS' });
      statusEl.textContent = 'Restored. Reloading…';
      setTimeout(() => location.reload(), 600);
    } catch (err) {
      statusEl.textContent = 'Restore failed: ' + err.message;
    }
  }

  function renderBackupStatus(statusEl) {
    try {
      const meta = JSON.parse(localStorage.getItem(BACKUP_META_KEY) || 'null');
      statusEl.textContent = meta ? 'Last backup: ' + new Date(meta.timestamp).toLocaleString() : 'No backup saved yet';
    } catch (e) {
      statusEl.textContent = 'No backup saved yet';
    }
  }

  function render() {
    const overlay = document.querySelector('.settings-overlay');
    const s = loadSettings();
    const learnerStats = window.LocalLearner ? window.LocalLearner.stats() : { patterns: 0, observations: 0 };
    const learnerEnabled = window.LocalLearner ? window.LocalLearner.isEnabled() : false;
    const hasFilesystem = !!fs();

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
        <div class="settings-section-title">Code backup</div>
        ${hasFilesystem ? `
          <p class="settings-desc">If you edit the app's code via Files, save a backup here first. If an edit breaks something, you can restore it — from here, or with the reset button on the home screen if things are broken badly enough that the app itself won't load.</p>
          <div class="settings-stat backup-status">Checking…</div>
          <div class="settings-btn-row">
            <button class="settings-btn save-backup-btn">Save Backup Now</button>
            <button class="settings-btn ghost restore-backup-btn">Restore Backup</button>
          </div>
          <button class="settings-btn ghost restore-factory-btn">Restore Factory Defaults</button>
        ` : `
          <p class="settings-desc">Code editing and backups only work in the installed app, not when running in Safari.</p>
        `}
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

    if (hasFilesystem) {
      const statusEl = overlay.querySelector('.backup-status');
      renderBackupStatus(statusEl);
      overlay.querySelector('.save-backup-btn').addEventListener('click', () => saveBackupNow(statusEl));
      overlay.querySelector('.restore-backup-btn').addEventListener('click', () => {
        if (confirm('Restore your last saved backup? This replaces the current code.')) restoreFrom('www-backup', statusEl);
      });
      overlay.querySelector('.restore-factory-btn').addEventListener('click', () => {
        if (confirm('Restore the original app files? This undoes all edits.')) restoreFrom('www-factory', statusEl);
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
