(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const startScreen = document.getElementById('startScreen');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const hud = document.getElementById('hud');
  const scoreLabel = document.getElementById('scoreLabel');
  const finalScoreEl = document.getElementById('finalScore');
  const bestStartEl = document.getElementById('bestStart');
  const bestEndEl = document.getElementById('bestEnd');
  const startBtn = document.getElementById('startBtn');
  const retryBtn = document.getElementById('retryBtn');

  let W, H, DPR;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  const BEST_KEY = 'stardodger_best';
  let best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
  bestStartEl.textContent = best;

  // Starfield
  let stars = [];
  function initStars() {
    stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.6 + 0.3,
        speed: Math.random() * 40 + 20,
      });
    }
  }
  initStars();

  const ship = {
    x: W / 2,
    y: H - 120,
    r: 16,
    targetX: W / 2,
  };

  let rocks = [];
  let particles = [];
  let score = 0;
  let elapsed = 0;
  let spawnTimer = 0;
  let spawnInterval = 0.9;
  let running = false;
  let gameStarted = false;
  let lastTime = 0;
  let shakeTime = 0;

  function resetGame() {
    ship.x = W / 2;
    ship.targetX = W / 2;
    ship.y = H - 120;
    rocks = [];
    particles = [];
    score = 0;
    elapsed = 0;
    spawnTimer = 0;
    spawnInterval = 0.9;
    shakeTime = 0;
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function spawnRock() {
    const r = rand(14, 34);
    rocks.push({
      x: rand(r, W - r),
      y: -r * 2,
      r,
      speed: rand(120, 190) + Math.min(elapsed * 4, 160),
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-1.5, 1.5),
      grazed: false,
    });
  }

  function addBurst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = rand(40, 220);
      particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: rand(0.3, 0.7),
        maxLife: 0.7,
        color,
      });
    }
  }

  function update(dt) {
    elapsed += dt;
    score += dt * 10;

    // difficulty ramp
    spawnInterval = Math.max(0.28, 0.9 - elapsed * 0.012);

    // ship follows target smoothly
    ship.x += (ship.targetX - ship.x) * Math.min(1, dt * 10);
    ship.x = Math.max(ship.r, Math.min(W - ship.r, ship.x));

    // spawn rocks
    spawnTimer += dt;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      spawnRock();
    }

    // update rocks
    for (let i = rocks.length - 1; i >= 0; i--) {
      const r = rocks[i];
      r.y += r.speed * dt;
      r.rot += r.rotSpeed * dt;

      const dx = r.x - ship.x;
      const dy = r.y - ship.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // near-miss bonus
      if (!r.grazed && dist < r.r + ship.r + 26 && dist > r.r + ship.r) {
        r.grazed = true;
        score += 25;
        addBurst(ship.x, ship.y, '#7ef9ff', 6);
      }

      // collision
      if (dist < r.r + ship.r - 6) {
        addBurst(ship.x, ship.y, '#ff5d5d', 26);
        shakeTime = 0.4;
        endGame();
        return;
      }

      if (r.y - r.r > H + 40) rocks.splice(i, 1);
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // stars
    for (const s of stars) {
      s.y += s.speed * dt;
      if (s.y > H) { s.y = -2; s.x = Math.random() * W; }
    }

    if (shakeTime > 0) shakeTime -= dt;

    scoreLabel.textContent = Math.floor(score);
  }

  function drawStars() {
    ctx.fillStyle = '#eaf2ff';
    for (const s of stars) {
      ctx.globalAlpha = 0.5 + Math.sin(elapsed * 2 + s.x) * 0.2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, ship.r + 14);
    grad.addColorStop(0, 'rgba(126,249,255,0.9)');
    grad.addColorStop(1, 'rgba(126,249,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, ship.r + 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r * 0.8, ship.r * 0.9);
    ctx.lineTo(0, ship.r * 0.4);
    ctx.lineTo(-ship.r * 0.8, ship.r * 0.9);
    ctx.closePath();
    ctx.fillStyle = '#eaf2ff';
    ctx.fill();
    ctx.strokeStyle = '#4bd0ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawRock(r) {
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.rot);
    ctx.beginPath();
    const spikes = 7;
    for (let i = 0; i < spikes; i++) {
      const ang = (i / spikes) * Math.PI * 2;
      const rad = r.r * (0.78 + (i % 3) * 0.09);
      const x = Math.cos(ang) * rad;
      const y = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#3a3f5c';
    ctx.fill();
    ctx.strokeStyle = '#8a93c4';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    let ox = 0, oy = 0;
    if (shakeTime > 0) {
      ox = rand(-6, 6) * shakeTime;
      oy = rand(-6, 6) * shakeTime;
    }
    ctx.save();
    ctx.translate(ox, oy);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a0c1e');
    bg.addColorStop(1, '#05060f');
    ctx.fillStyle = bg;
    ctx.fillRect(-10, -10, W + 20, H + 20);

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

    requestAnimationFrame(loop);
  }

  function startGame() {
    resetGame();
    running = true;
    gameStarted = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
  }

  function endGame() {
    running = false;
    const finalScore = Math.floor(score);
    if (finalScore > best) {
      best = finalScore;
      localStorage.setItem(BEST_KEY, String(best));
    }
    finalScoreEl.textContent = 'Score: ' + finalScore;
    bestEndEl.textContent = best;
    hud.classList.add('hidden');
    setTimeout(() => gameOverScreen.classList.remove('hidden'), 350);
  }

  // input
  let dragging = false;
  function pointerX(e) {
    return (e.touches ? e.touches[0].clientX : e.clientX);
  }
  canvas.addEventListener('touchstart', (e) => { dragging = true; ship.targetX = pointerX(e); }, { passive: true });
  canvas.addEventListener('touchmove', (e) => { if (dragging) ship.targetX = pointerX(e); }, { passive: true });
  canvas.addEventListener('touchend', () => { dragging = false; }, { passive: true });
  canvas.addEventListener('mousedown', (e) => { dragging = true; ship.targetX = pointerX(e); });
  window.addEventListener('mousemove', (e) => { if (dragging) ship.targetX = pointerX(e); });
  window.addEventListener('mouseup', () => { dragging = false; });

  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);

  requestAnimationFrame(loop);
})();
