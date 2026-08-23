window.Games = window.Games || {};
window.Games.snake = (function () {
  let container, canvas, ctx;
  let W, H, cell, cols, rows;
  let snake, dir, nextDir, food, score, best, running, over;
  let tickInterval = null;
  const BEST_KEY = 'snake_best';
  let touchStartX = 0, touchStartY = 0;
  let resizeHandler;

  function resize() {
    W = container.clientWidth;
    H = container.clientHeight;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cell = Math.floor(Math.min(W, H) / 18);
    cols = Math.floor(W / cell);
    rows = Math.floor(H / cell);
  }

  function reset() {
    const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);
    snake = [{x:cx,y:cy},{x:cx-1,y:cy},{x:cx-2,y:cy}];
    dir = {x:1,y:0};
    nextDir = {x:1,y:0};
    score = 0;
    over = false;
    placeFood();
  }

  function placeFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random()*cols), y: Math.floor(Math.random()*rows) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
  }

  function tick() {
    if (over) return;
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows || snake.some(s => s.x === head.x && s.y === head.y)) {
      endGame();
      return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      placeFood();
    } else {
      snake.pop();
    }
    draw();
    container.querySelector('.score-big').textContent = score;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#16210f'); bg.addColorStop(1, '#10190f');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#d1a13c';
    ctx.beginPath();
    ctx.arc(food.x*cell + cell/2, food.y*cell + cell/2, cell*0.38, 0, Math.PI*2);
    ctx.fill();

    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#93c07f' : '#5d7d54';
      ctx.globalAlpha = i === 0 ? 1 : 0.85;
      const pad = 1.5;
      ctx.beginPath();
      const r = 4;
      const x = s.x*cell+pad, y = s.y*cell+pad, w = cell-pad*2, h = cell-pad*2;
      ctx.moveTo(x+r,y);
      ctx.arcTo(x+w,y,x+w,y+h,r);
      ctx.arcTo(x+w,y+h,x,y+h,r);
      ctx.arcTo(x,y+h,x,y,r);
      ctx.arcTo(x,y,x+w,y,r);
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function setDir(x, y) {
    if (x === -dir.x && y === -dir.y) return; // no reverse
    nextDir = {x, y};
  }

  function startGame() {
    reset();
    over = false;
    running = true;
    container.querySelector('.start-overlay').classList.add('hidden');
    container.querySelector('.gameover-overlay').classList.add('hidden');
    container.querySelector('.game-hud').classList.remove('hidden');
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(tick, 130);
    draw();
  }

  function endGame() {
    over = true;
    running = false;
    if (tickInterval) clearInterval(tickInterval);
    if (score > best) { best = score; localStorage.setItem(BEST_KEY, String(best)); }
    container.querySelector('.final-score').textContent = 'Score: ' + score;
    container.querySelector('.best-end').textContent = best;
    container.querySelector('.game-hud').classList.add('hidden');
    setTimeout(() => container.querySelector('.gameover-overlay').classList.remove('hidden'), 250);
  }

  let onTouchStart, onTouchEnd;

  function mount(el) {
    container = el;
    best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);

    container.innerHTML = `
      <div class="game-canvas-wrap">
        <canvas></canvas>
        <div class="overlay start-overlay">
          <h1>SNAKE</h1>
          <p>Swipe or use the arrows to steer.<br/>Eat the dots, don't hit yourself.</p>
          <button class="btn start-btn">TAP TO PLAY</button>
          <p class="best">Best: <span class="best-start">${best}</span></p>
        </div>
        <div class="overlay gameover-overlay hidden">
          <h1>GAME OVER</h1>
          <p class="final-score">Score: 0</p>
          <p class="best">Best: <span class="best-end">${best}</span></p>
          <button class="btn retry-btn">TRY AGAIN</button>
        </div>
        <div class="game-hud hidden"><span class="score-big">0</span></div>
        <div class="dpad">
          <div></div><button class="dp-up">▲</button><div></div>
          <button class="dp-left">◀</button><div></div><button class="dp-right">▶</button>
          <div></div><button class="dp-down">▼</button><div></div>
        </div>
      </div>
    `;

    canvas = container.querySelector('canvas');
    ctx = canvas.getContext('2d');
    resizeHandler = resize;
    window.addEventListener('resize', resizeHandler);
    resize();
    reset();
    draw();

    container.querySelector('.dp-up').addEventListener('click', () => setDir(0,-1));
    container.querySelector('.dp-down').addEventListener('click', () => setDir(0,1));
    container.querySelector('.dp-left').addEventListener('click', () => setDir(-1,0));
    container.querySelector('.dp-right').addEventListener('click', () => setDir(1,0));

    onTouchStart = (e) => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; };
    onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 20) setDir(dx > 0 ? 1 : -1, 0);
      } else {
        if (Math.abs(dy) > 20) setDir(0, dy > 0 ? 1 : -1);
      }
    };
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });

    container.querySelector('.start-btn').addEventListener('click', startGame);
    container.querySelector('.retry-btn').addEventListener('click', startGame);
  }

  function unmount() {
    if (tickInterval) clearInterval(tickInterval);
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
  }

  return { mount, unmount };
})();
