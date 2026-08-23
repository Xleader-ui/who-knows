window.Games = window.Games || {};
window.Games.tictactoe = (function () {
  let container;
  const WIN_LINES = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  let board, current, over;
  let clickHandlers = [];

  function reset() {
    board = Array(9).fill(null);
    current = 'X';
    over = false;
    render();
  }

  function checkWinner() {
    for (const line of WIN_LINES) {
      const [a,b,c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line };
    }
    if (board.every(v => v)) return { winner: 'draw', line: [] };
    return null;
  }

  function render() {
    const status = container.querySelector('.board-status');
    const grid = container.querySelector('.ttt-grid');
    grid.innerHTML = '';
    const result = checkWinner();

    board.forEach((v, i) => {
      const cell = document.createElement('button');
      cell.className = 'ttt-cell' + (v === 'O' ? ' o' : '') + (result && result.line.includes(i) ? ' win' : '');
      cell.textContent = v || '';
      if (!v && !over) {
        cell.addEventListener('click', () => handleMove(i));
      }
      grid.appendChild(cell);
    });

    if (result) {
      over = true;
      status.innerHTML = result.winner === 'draw' ? "It's a draw!" : `<strong>${result.winner}</strong> wins!`;
    } else {
      status.innerHTML = `Turn: <strong>${current}</strong>`;
    }
  }

  function handleMove(i) {
    if (board[i] || over) return;
    board[i] = current;
    current = current === 'X' ? 'O' : 'X';
    render();
  }

  function mount(el) {
    container = el;
    container.innerHTML = `
      <div class="board-screen">
        <div class="board-status">Turn: <strong>X</strong></div>
        <div class="ttt-grid"></div>
        <button class="btn ghost restart-btn">RESTART</button>
      </div>
    `;
    container.querySelector('.restart-btn').addEventListener('click', reset);
    reset();
  }

  function unmount() {
    container = null;
  }

  return { mount, unmount };
})();
