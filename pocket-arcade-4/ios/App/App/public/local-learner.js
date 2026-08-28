// ============================================================================
// LOCAL LEARNER — a small statistical language model that trains entirely
// on-device, on your CPU, from the text of your own conversations. This is
// NOT a neural network and nowhere near the capability of the cloud models
// you're chatting with — it's a trigram (order-2) Markov chain: it learns
// which words tend to follow which pairs of words, purely by counting, and
// can sample short continuations from what it's learned. It's instant,
// costs no battery to speak of, and needs no network or GPU. Honest framing:
// think "learns your texting patterns," not "learns to reason."
// ============================================================================

window.LocalLearner = (function () {
  const STORAGE_KEY = 'local_learner_v1';
  const ENABLED_KEY = 'local_learner_enabled_v1';
  const MAX_KEYS = 6000; // cap stored trigram keys so this can't grow unbounded

  function isEnabled() {
    const v = localStorage.getItem(ENABLED_KEY);
    return v === null ? true : v === 'true';
  }
  function setEnabled(val) { localStorage.setItem(ENABLED_KEY, val ? 'true' : 'false'); }

  function loadModel() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveModel(model) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(model)); } catch (e) { /* storage full, ignore */ }
  }

  function tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9'\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 400); // cap per-message length so one huge message can't dominate a training pass
  }

  function trainOn(text) {
    if (!isEnabled() || !text) return;
    const words = tokenize(text);
    if (words.length < 3) return;

    const model = loadModel();
    let keyCount = Object.keys(model).length;

    for (let i = 0; i < words.length - 2; i++) {
      const key = words[i] + ' ' + words[i + 1];
      const next = words[i + 2];
      if (!model[key]) {
        if (keyCount >= MAX_KEYS) continue; // stop adding new keys once at cap, existing ones keep updating
        model[key] = {};
        keyCount++;
      }
      model[key][next] = (model[key][next] || 0) + 1;
    }
    saveModel(model);
  }

  function stats() {
    const model = loadModel();
    const keys = Object.keys(model);
    let totalObservations = 0;
    for (const k of keys) {
      for (const w of Object.keys(model[k])) totalObservations += model[k][w];
    }
    return { patterns: keys.length, observations: totalObservations };
  }

  function weightedPick(counts) {
    const entries = Object.entries(counts);
    const total = entries.reduce((s, [, c]) => s + c, 0);
    let r = Math.random() * total;
    for (const [word, c] of entries) {
      r -= c;
      if (r <= 0) return word;
    }
    return entries[entries.length - 1][0];
  }

  function generate(seedText, maxWords) {
    const model = loadModel();
    const keys = Object.keys(model);
    if (!keys.length) return '(no training data yet — keep chatting)';

    let words = tokenize(seedText || '');
    if (words.length < 2) {
      // start from a random known pair if the seed is too short
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      words = randomKey.split(' ');
    }

    const out = words.slice(-2);
    for (let i = 0; i < (maxWords || 20); i++) {
      const key = out[out.length - 2] + ' ' + out[out.length - 1];
      const options = model[key];
      if (!options) break;
      out.push(weightedPick(options));
    }
    return out.join(' ');
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return { isEnabled, setEnabled, trainOn, stats, generate, reset };
})();
