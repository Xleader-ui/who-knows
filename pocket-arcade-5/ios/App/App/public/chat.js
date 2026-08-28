(function () {
  let sending = false;

  const ROTATION_STORAGE = 'chat_key_rotation_v2';
  const ACTIVE_MODEL_STORAGE = 'chat_active_model_v2';
  const THREAD_STORAGE = 'chat_thread_v2';

  function getModels() { return window.MODELS || []; }

  function activeModelId() {
    const saved = localStorage.getItem(ACTIVE_MODEL_STORAGE);
    const models = getModels();
    if (saved && models.some(m => m.id === saved)) return saved;
    return models[0] ? models[0].id : null;
  }
  function setActiveModelId(id) { localStorage.setItem(ACTIVE_MODEL_STORAGE, id); }
  function activeModelEntry() {
    return getModels().find(m => m.id === activeModelId()) || null;
  }

  function loadRotation() {
    try { return JSON.parse(localStorage.getItem(ROTATION_STORAGE) || '{}'); } catch (e) { return {}; }
  }
  function saveRotation(r) { localStorage.setItem(ROTATION_STORAGE, JSON.stringify(r)); }

  function nextKeyIndex(modelId, count) {
    const rotation = loadRotation();
    const idx = (rotation[modelId] || 0) % count;
    rotation[modelId] = (idx + 1) % count;
    saveRotation(rotation);
    return idx;
  }

  function validKeys(entry) {
    return (entry.keys || []).filter(k => k && !k.includes('REPLACE_WITH'));
  }

  function loadThread() {
    try { return JSON.parse(localStorage.getItem(THREAD_STORAGE) || '[]'); } catch (e) { return []; }
  }
  function saveThread(thread) { localStorage.setItem(THREAD_STORAGE, JSON.stringify(thread)); }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ---------- header ----------
  function renderHeader() {
    const entry = activeModelEntry();
    document.querySelector('.model-name').textContent = entry ? entry.label : 'No model configured';
  }

  // ---------- thread rendering ----------
  function renderThread() {
    const thread = loadThread();
    const messagesEl = document.querySelector('.chat-messages');
    messagesEl.innerHTML = '';
    if (!thread.length) {
      const entry = activeModelEntry();
      messagesEl.innerHTML = `<div class="chat-empty">${entry ? 'Message ' + escapeHtml(entry.label) : 'No models configured — edit models.config.js'}</div>`;
      return;
    }
    thread.forEach(m => {
      const row = document.createElement('div');
      row.className = 'msg-row msg-enter ' + m.role;
      if (m.role === 'user') {
        row.innerHTML = `<div class="msg-bubble">${escapeHtml(m.content)}</div>`;
      } else if (m.role === 'error') {
        row.innerHTML = `<div class="msg-error">${escapeHtml(m.content)}</div>`;
      } else {
        row.innerHTML = `<div class="msg-plain"></div>`;
        row.querySelector('.msg-plain').textContent = m.content;
      }
      messagesEl.appendChild(row);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ---------- sending ----------
  async function sendMessage(text) {
    if (sending) return;
    const entry = activeModelEntry();
    if (!entry) {
      const thread = loadThread();
      thread.push({ role: 'error', content: 'No models configured. Edit models.config.js to add one.' });
      saveThread(thread);
      renderThread();
      return;
    }
    const keyList = validKeys(entry);
    if (!keyList.length) {
      const thread = loadThread();
      thread.push({ role: 'error', content: `No key set for "${entry.label}". Edit models.config.js and replace the placeholder key.` });
      saveThread(thread);
      renderThread();
      return;
    }

    if (entry.type === 'embedding') {
      return sendEmbeddingRequest(text, entry, keyList);
    }

    sending = true;
    const sendBtn = document.querySelector('.chat-send');
    sendBtn.disabled = true;

    const thread = loadThread();
    thread.push({ role: 'user', content: text });
    saveThread(thread);
    renderThread();
    if (window.LocalLearner) window.LocalLearner.trainOn(text);

    const messagesEl = document.querySelector('.chat-messages');
    const row = document.createElement('div');
    row.className = 'msg-row assistant msg-enter';
    row.innerHTML = `<div class="msg-plain"><span class="typing-dots"><span></span><span></span><span></span></span></div>`;
    const plainEl = row.querySelector('.msg-plain');
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    let assistantText = '';
    let pendingFlush = false;
    function scheduleFlush() {
      if (pendingFlush) return;
      pendingFlush = true;
      requestAnimationFrame(() => {
        plainEl.textContent = assistantText;
        messagesEl.scrollTop = messagesEl.scrollHeight;
        pendingFlush = false;
      });
    }

    try {
      const url = entry.apiBase.replace(/\/$/, '') + '/chat/completions';
      const body = JSON.stringify({
        model: entry.model,
        messages: thread.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content })),
        stream: true,
      });

      const startIdx = nextKeyIndex(entry.id, keyList.length);
      let res = null;
      let lastErr = null;

      for (let attempt = 0; attempt < keyList.length; attempt++) {
        const idx = (startIdx + attempt) % keyList.length;
        const candidateKey = keyList[idx];
        try {
          const attemptRes = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + candidateKey,
              'Content-Type': 'application/json',
            },
            body,
          });
          if (attemptRes.ok && attemptRes.body) { res = attemptRes; break; }

          let detail = attemptRes.status + ' ' + attemptRes.statusText;
          try {
            const errJson = await attemptRes.json();
            if (errJson.error && errJson.error.message) detail = errJson.error.message;
          } catch (e) { /* ignore */ }
          lastErr = new Error(detail);

          const retryable = attemptRes.status === 429 || attemptRes.status === 401 || attemptRes.status === 403;
          if (!retryable) break;
        } catch (networkErr) {
          lastErr = networkErr;
        }
      }

      if (!res) throw (lastErr || new Error('All keys failed'));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices && json.choices[0] && json.choices[0].delta;
            if (delta && delta.content) {
              assistantText += delta.content;
              scheduleFlush();
            }
          } catch (e) { /* skip malformed chunk */ }
        }
      }

      plainEl.textContent = assistantText; // final sync flush in case a scheduled rAF hasn't fired yet

      const finalThread = loadThread();
      finalThread.push({ role: 'assistant', content: assistantText || '(empty response)' });
      saveThread(finalThread);
      if (window.LocalLearner && assistantText) window.LocalLearner.trainOn(assistantText);
    } catch (err) {
      row.remove();
      const errThread = loadThread();
      errThread.push({ role: 'error', content: 'Request failed: ' + err.message });
      saveThread(errThread);
      renderThread();
    } finally {
      sending = false;
      sendBtn.disabled = false;
    }
  }

  // ---------- embeddings ----------
  async function sendEmbeddingRequest(text, entry, keyList) {
    sending = true;
    const sendBtn = document.querySelector('.chat-send');
    sendBtn.disabled = true;

    const thread = loadThread();
    thread.push({ role: 'user', content: text });
    saveThread(thread);
    renderThread();
    if (window.LocalLearner) window.LocalLearner.trainOn(text);

    try {
      const url = entry.apiBase.replace(/\/$/, '') + '/embeddings';
      const body = JSON.stringify({ model: entry.model, input: text });

      const startIdx = nextKeyIndex(entry.id, keyList.length);
      let res = null;
      let lastErr = null;

      for (let attempt = 0; attempt < keyList.length; attempt++) {
        const idx = (startIdx + attempt) % keyList.length;
        const candidateKey = keyList[idx];
        try {
          const attemptRes = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + candidateKey,
              'Content-Type': 'application/json',
            },
            body,
          });
          if (attemptRes.ok) { res = attemptRes; break; }
          let detail = attemptRes.status + ' ' + attemptRes.statusText;
          try {
            const errJson = await attemptRes.json();
            if (errJson.error && errJson.error.message) detail = errJson.error.message;
          } catch (e) { /* ignore */ }
          lastErr = new Error(detail);
          const retryable = attemptRes.status === 429 || attemptRes.status === 401 || attemptRes.status === 403;
          if (!retryable) break;
        } catch (networkErr) {
          lastErr = networkErr;
        }
      }

      if (!res) throw (lastErr || new Error('All keys failed'));

      const json = await res.json();
      const vector = json.data && json.data[0] && json.data[0].embedding;
      const dims = vector ? vector.length : 0;
      const preview = vector ? vector.slice(0, 5).map(v => v.toFixed(4)).join(', ') : '';
      const summary = dims
        ? `Embedding generated — ${dims} dimensions.\nFirst 5 values: [${preview}, ...]`
        : 'No embedding returned.';

      const finalThread = loadThread();
      finalThread.push({ role: 'assistant', content: summary });
      saveThread(finalThread);
      renderThread();
    } catch (err) {
      const errThread = loadThread();
      errThread.push({ role: 'error', content: 'Embedding request failed: ' + err.message });
      saveThread(errThread);
      renderThread();
    } finally {
      sending = false;
      sendBtn.disabled = false;
    }
  }

  // ---------- model picker ----------
  function openModelPicker() {
    const overlay = document.querySelector('.model-picker');
    overlay.classList.remove('hidden');
    const listEl = overlay.querySelector('.picker-list');
    const models = getModels();
    listEl.innerHTML = '';
    if (!models.length) {
      listEl.innerHTML = `<div class="chat-empty">No models in models.config.js</div>`;
      return;
    }
    models.forEach(m => {
      const item = document.createElement('button');
      item.className = 'picker-item' + (m.id === activeModelId() ? ' active' : '');
      const keyCount = validKeys(m).length;
      item.innerHTML = `<span>${escapeHtml(m.label)}</span><span class="picker-item-sub">${escapeHtml(m.model)}${keyCount ? '' : ' · no key set'}</span>`;
      item.addEventListener('click', () => {
        setActiveModelId(m.id);
        overlay.classList.add('hidden');
        renderHeader();
        renderThread();
      });
      listEl.appendChild(item);
    });
  }

  // ---------- init ----------
  function init() {
    renderHeader();
    renderThread();

    document.querySelector('.model-picker-trigger').addEventListener('click', openModelPicker);
    document.querySelector('.close-model-picker').addEventListener('click', () => document.querySelector('.model-picker').classList.add('hidden'));
    document.querySelector('.new-chat-btn').addEventListener('click', () => {
      saveThread([]);
      renderThread();
    });
    const settingsTrigger = document.querySelector('.settings-trigger');
    if (settingsTrigger && window.Settings) settingsTrigger.addEventListener('click', window.Settings.open);
    const closeSettingsBtn = document.querySelector('.close-settings');
    if (closeSettingsBtn && window.Settings) closeSettingsBtn.addEventListener('click', window.Settings.close);

    const textarea = document.querySelector('.chat-input-row textarea');
    const sendBtn = document.querySelector('.chat-send');

    function autoGrow() {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    textarea.addEventListener('input', autoGrow);

    sendBtn.addEventListener('click', () => {
      const text = textarea.value.trim();
      if (!text) return;
      textarea.value = '';
      autoGrow();
      sendMessage(text);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
