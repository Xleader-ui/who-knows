window.Games = window.Games || {};
window.Games.connect4 = (function () {
  const COLS = 7, ROWS = 6;
  let container, cells, current, over;

  function reset() {
    cells = Array(COLS * ROWS).fill(null); // index = row*COLS + col, row 0 = top
    current = 'red';
    over = false;
    render();
  }

  function idx(row, col) { return row * COLS + col; }

  function dropInColumn(col) {
    if (over) return;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!cells[idx(row, col)]) {
        cells[idx(row, col)] = current;
        const result = checkWinner(row, col);
        if (result) {
          over = true;
          render(result);
        } else if (cells.every(v => v)) {
          over = true;
          render(null, true);
        } else {
          current = current === 'red' ? 'yellow' : 'red';
          render();
        }
        return;
      }
    }
  }

  function checkWinner(row, col) {
    const color = cells[idx(row, col)];
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
      const line = [[row,col]];
      for (let s = 1; s < 4; s++) {
        const r = row + dr*s, c = col + dc*s;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS || cells[idx(r,c)] !== color) break;
        line.push([r,c]);
      }
      for (let s = 1; s < 4; s++) {
        const r = row - dr*s, c = col - dc*s;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS || cells[idx(r,c)] !== color) break;
        line.push([r,c]);
      }
      if (line.length >= 4) return { color, line };
    }
    return null;
  }

  function render(winResult, draw) {
    const status = container.querySelector('.board-status');
    const boardEl = container.querySelector('.c4-board');
    boardEl.innerHTML = '';

    const winCells = new Set((winResult ? winResult.line : []).map(([r,c]) => idx(r,c)));

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const btn = document.createElement('button');
        btn.className = 'c4-col-btn';
        const cellDiv = document.createElement('div');
        const v = cells[idx(row, col)];
        cellDiv.className = 'c4-cell' + (v ? ' ' + v : '') + (winCells.has(idx(row,col)) ? ' win' : '');
        btn.appendChild(cellDiv);
        if (!over) btn.addEventListener('click', () => dropInColumn(col));
        boardEl.appendChild(btn);
      }
    }

    if (winResult) {
      status.innerHTML = `<strong style="color:${winResult.color === 'red' ? '#ff5d5d' : '#ffd166'}">${winResult.color.toUpperCase()}</strong> wins!`;
    } else if (draw) {
      status.textContent = "It's a draw!";
    } else {
      status.innerHTML = `Turn: <strong style="color:${current === 'red' ? '#ff5d5d' : '#ffd166'}">${current.toUpperCase()}</strong>`;
    }
  }

  function mount(el) {
    container = el;
    container.innerHTML = `
      <div class="board-screen">
        <div class="board-status">Turn: <strong style="color:#ff5d5d">RED</strong></div>
        <div class="c4-board"></div>
        <button class="btn ghost restart-btn">RESTART</button>
      </div>
    `;
    container.querySelector('.restart-btn').addEventListener('click', reset);
    reset();
  }

  function unmount() { container = null; }

  return { mount, unmount };
})();
