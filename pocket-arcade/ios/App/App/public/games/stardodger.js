window.Games = window.Games || {};
window.Games.stardodger = (function () {
  let canvas, ctx, container;
  let W, H, DPR;
  let raf = null;
  let running = false;
  let lastTime = 0;
  let resizeHandler = null;

  const BEST_KEY = 'stardodger_best';
  let best = 0;

  let stars = [];
  let ship, rocks, particles, score, elapsed, spawnTimer, spawnInterval, shakeTime;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = container.clientWidth;
    H = container.clientHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    initStars();
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.3, speed: Math.random() * 40 + 20 });
    }
  }

  function resetGame() {
    ship = { x: W / 2, y: H - 120, r: 16, targetX: W / 2 };
    rocks = [];
    particles = [];
    score = 0;
    elapsed = 0;
    spawnTimer = 0;
    spawnInterval = 0.9;
    shakeTime = 0;
  }

  function spawnRock() {
    const r = rand(14, 34);
    rocks.push({ x: rand(r, W - r), y: -r * 2, r, speed: rand(120, 190) + Math.min(elapsed * 4, 160), rot: rand(0, Math.PI * 2), rotSpeed: rand(-1.5, 1.5), grazed: false });
  }

  function addBurst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = rand(40, 220);
      particles.push({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: rand(0.3, 0.7), maxLife: 0.7, color });
    }
  }

  function update(dt) {
    elapsed += dt;
    score += dt * 10;
    spawnInterval = Math.max(0.28, 0.9 - elapsed * 0.012);

    ship.x += (ship.targetX - ship.x) * Math.min(1, dt * 10);
    ship.x = Math.max(ship.r, Math.min(W - ship.r, ship.x));

    spawnTimer += dt;
    if (spawnTimer >= spawnInterval) { spawnTimer = 0; spawnRock(); }

    for (let i = rocks.length - 1; i >= 0; i--) {
      const r = rocks[i];
      r.y += r.speed * dt;
      r.rot += r.rotSpeed * dt;
      const dx = r.x - ship.x, dy = r.y - ship.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (!r.grazed && dist < r.r + ship.r + 26 && dist > r.r + ship.r) {
        r.grazed = true; score += 25; addBurst(ship.x, ship.y, '#93c07f', 6);
      }
      if (dist < r.r + ship.r - 6) {
        addBurst(ship.x, ship.y, '#c8531f', 26);
        shakeTime = 0.4;
        endGame();
        return;
      }
      if (r.y - r.r > H + 40) rocks.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96;
      if (p.life <= 0) particles.splice(i, 1);
    }

    for (const s of stars) { s.y += s.speed * dt; if (s.y > H) { s.y = -2; s.x = Math.random() * W; } }
    if (shakeTime > 0) shakeTime -= dt;

    const scoreLabel = container.querySelector('.score-big');
    if (scoreLabel) scoreLabel.textContent = Math.floor(score);
  }

  function drawStars() {
    ctx.fillStyle = '#f1ead9';
    for (const s of stars) {
      ctx.globalAlpha = 0.5 + Math.sin(elapsed * 2 + s.x) * 0.2;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawShip() {
    ctx.save(); ctx.translate(ship.x, ship.y);
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, ship.r + 14);
    grad.addColorStop(0, 'rgba(147,192,127,0.9)'); grad.addColorStop(1, 'rgba(147,192,127,0)');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, ship.r + 14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -ship.r); ctx.lineTo(ship.r * 0.8, ship.r * 0.9); ctx.lineTo(0, ship.r * 0.4); ctx.lineTo(-ship.r * 0.8, ship.r * 0.9);
    ctx.closePath(); ctx.fillStyle = '#f1ead9'; ctx.fill();
    ctx.strokeStyle = '#5d7d54'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  function drawRock(r) {
    ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.rot);
    ctx.beginPath();
    const spikes = 7;
    for (let i = 0; i < spikes; i++) {
      const ang = (i / spikes) * Math.PI * 2;
      const rad = r.r * (0.78 + (i % 3) * 0.09);
      const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fillStyle = '#3a3a28'; ctx.fill();
    ctx.strokeStyle = '#7c7361'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    let ox = 0, oy = 0;
    if (shakeTime > 0) { ox = rand(-6, 6) * shakeTime; oy = rand(-6, 6) * shakeTime; }
    ctx.save(); ctx.translate(ox, oy);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#16210f'); bg.addColorStop(1, '#10190f');
    ctx.fillStyle = bg; ctx.fillRect(-10, -10, W + 20, H + 20);
    drawStars();
    for (const r of rocks) drawRock(r);
    if (running) drawShip();
    drawParticles();
    ctx.restore();
  }

  function loop(t) {
    if (!lastTime) lastTime = t;
    const dt = Math.min(0.033, (t - lastTime) / 1000);
    lastTime = t;
    if (running) update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function startGame() {
    resetGame();
    running = true;
    container.querySelector('.start-overlay').classList.add('hidden');
    container.querySelector('.gameover-overlay').classList.add('hidden');
    container.querySelector('.game-hud').classList.remove('hidden');
  }

  function endGame() {
    running = false;
    const finalScore = Math.floor(score);
    if (finalScore > best) { best = finalScore; localStorage.setItem(BEST_KEY, String(best)); }
    container.querySelector('.final-score').textContent = 'Score: ' + finalScore;
    container.querySelector('.best-end').textContent = best;
    container.querySelector('.game-hud').classList.add('hidden');
    setTimeout(() => container.querySelector('.gameover-overlay').classList.remove('hidden'), 350);
  }

  let dragging = false;
  function pointerX(e) { return (e.touches ? e.touches[0].clientX : e.clientX); }
  let onTouchStart, onTouchMove, onTouchEnd, onMouseDown, onMouseMove, onMouseUp;

  function mount(el) {
    container = el;
    best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);

    container.innerHTML = `
      <div class="game-canvas-wrap">
        <canvas></canvas>
        <div class="overlay start-overlay">
          <h1>STAR DODGER</h1>
          <p>Drag to steer. Dodge the rocks.<br/>Fly close for bonus points.</p>
          <button class="btn start-btn">TAP TO PLAY</button>
          <p class="best">Best: <span class="best-start">${best}</span></p>
        </div>
        <div class="overlay gameover-overlay hidden">
          <h1>CRASHED</h1>
          <p class="final-score">Score: 0</p>
          <p class="best">Best: <span class="best-end">${best}</span></p>
          <button class="btn retry-btn">TRY AGAIN</button>
        </div>
        <div class="game-hud hidden"><span class="score-big">0</span></div>
      </div>
    `;

    canvas = container.querySelector('canvas');
    ctx = canvas.getContext('2d');

    resizeHandler = resize;
    window.addEventListener('resize', resizeHandler);
    resize();

    onTouchStart = (e) => { dragging = true; ship.targetX = pointerX(e); };
    onTouchMove = (e) => { if (dragging) ship.targetX = pointerX(e); };
    onTouchEnd = () => { dragging = false; };
    onMouseDown = (e) => { dragging = true; ship.targetX = pointerX(e); };
    onMouseMove = (e) => { if (dragging) ship.targetX = pointerX(e); };
    onMouseUp = () => { dragging = false; };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    container.querySelector('.start-btn').addEventListener('click', startGame);
    container.querySelector('.retry-btn').addEventListener('click', startGame);

    resetGame();
    lastTime = 0;
    raf = requestAnimationFrame(loop);
  }

  function unmount() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  return { mount, unmount };
})();
