window.Games = window.Games || {};
window.Games.twenty48 = (function () {
  let container, grid, score, best, over, won;
  const SIZE = 4;
  const BEST_KEY = 'twenty48_best';
  let touchStartX = 0, touchStartY = 0;

  function emptyGrid() { return Array.from({length: SIZE}, () => Array(SIZE).fill(0)); }

  function reset() {
    grid = emptyGrid();
    score = 0;
    over = false;
    won = false;
    addTile(); addTile();
    render();
  }

  function addTile() {
    const empties = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!grid[r][c]) empties.push([r,c]);
    if (!empties.length) return;
    const [r,c] = empties[Math.floor(Math.random()*empties.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function slideRow(row) {
    let arr = row.filter(v => v);
    let gained = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i+1]) {
        arr[i] *= 2;
        gained += arr[i];
        arr.splice(i+1, 1);
      }
    }
    while (arr.length < SIZE) arr.push(0);
    return { arr, gained };
  }

  function move(dir) {
    if (over) return;
    let moved = false;
    let totalGain = 0;
    const rotated = rotateForDir(grid, dir);
    const newRotated = rotated.map(row => {
      const { arr, gained } = slideRow(row);
      totalGain += gained;
      return arr;
    });
    const result = unrotateForDir(newRotated, dir);

    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (result[r][c] !== grid[r][c]) moved = true;

    if (moved) {
      grid = result;
      score += totalGain;
      addTile();
      if (grid.some(row => row.includes(2048)) && !won) won = true;
      if (!hasMoves()) over = true;
      render();
    }
  }

  function rotateForDir(g, dir) {
    // normalize so "left" slide logic always applies
    if (dir === 'left') return g.map(row => row.slice());
    if (dir === 'right') return g.map(row => row.slice().reverse());
    if (dir === 'up') return transpose(g);
    if (dir === 'down') return transpose(g).map(row => row.slice().reverse());
  }
  function unrotateForDir(g, dir) {
    if (dir === 'left') return g.map(row => row.slice());
    if (dir === 'right') return g.map(row => row.slice().reverse());
    if (dir === 'up') return transpose(g);
    if (dir === 'down') return transpose(g.map(row => row.slice().reverse()));
  }
  function transpose(g) {
    const t = emptyGrid();
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) t[c][r] = g[r][c];
    return t;
  }

  function hasMoves() {
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      if (!grid[r][c]) return true;
      if (c < SIZE-1 && grid[r][c] === grid[r][c+1]) return true;
      if (r < SIZE-1 && grid[r][c] === grid[r+1][c]) return true;
    }
    return false;
  }

  function render() {
    const gridEl = container.querySelector('.grid2048');
    gridEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      const tile = document.createElement('div');
      tile.className = 'tile2048';
      if (v) { tile.dataset.v = v; tile.textContent = v; }
      gridEl.appendChild(tile);
    }
    if (score > best) { best = score; localStorage.setItem(BEST_KEY, String(best)); }
    container.querySelector('.score-big-inline').textContent = score;
    container.querySelector('.best-inline').textContent = best;
    const status = container.querySelector('.board-status');
    status.textContent = over ? "No more moves — game over" : (won ? "You hit 2048! Keep going for a higher score." : 'Swipe to merge tiles');
  }

  function onTouchStart(e) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }
  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
  }

  function mount(el) {
    container = el;
    best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
    container.innerHTML = `
      <div class="board-screen">
        <div class="score-row">
          <div class="p1">Score: <span class="score-big-inline">0</span></div>
          <div class="p2">Best: <span class="best-inline">${best}</span></div>
        </div>
        <div class="grid2048"></div>
        <div class="board-status">Swipe to merge tiles</div>
        <button class="btn ghost restart-btn">RESTART</button>
      </div>
    `;
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.querySelector('.restart-btn').addEventListener('click', reset);
    reset();
  }

  function unmount() {
    if (container) {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
    }
    container = null;
  }

  return { mount, unmount };
})();
