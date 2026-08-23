window.Games = window.Games || {};
window.Games.memory = (function () {
  let container, cards, flipped, matchedCount, moves, players, scores, current, busy;
  const EMOJIS = ['🚀','🐍','🍕','⭐','🎲','🍩','🎧','🐙'];

  function buildDeck() {
    const deck = [...EMOJIS, ...EMOJIS];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
  }

  function reset() {
    cards = buildDeck();
    flipped = [];
    matchedCount = 0;
    moves = 0;
    scores = [0, 0];
    current = 0;
    busy = false;
    render();
  }

  function flip(card) {
    if (busy || card.flipped || card.matched || flipped.length >= 2) return;
    card.flipped = true;
    flipped.push(card);
    render();

    if (flipped.length === 2) {
      moves++;
      busy = true;
      const [a, b] = flipped;
      if (a.emoji === b.emoji) {
        setTimeout(() => {
          a.matched = true; b.matched = true;
          matchedCount += 2;
          scores[current]++;
          flipped = [];
          busy = false;
          render();
        }, 400);
      } else {
        setTimeout(() => {
          a.flipped = false; b.flipped = false;
          flipped = [];
          if (players === 2) current = 1 - current;
          busy = false;
          render();
        }, 700);
      }
    }
  }

  function render() {
    const gridEl = container.querySelector('.memory-grid');
    gridEl.innerHTML = '';
    cards.forEach(card => {
      const el = document.createElement('button');
      el.className = 'memory-card' + (card.flipped || card.matched ? ' flipped' : '') + (card.matched ? ' matched' : '');
      el.textContent = (card.flipped || card.matched) ? card.emoji : '❔';
      el.addEventListener('click', () => flip(card));
      gridEl.appendChild(el);
    });

    const status = container.querySelector('.board-status');
    const done = matchedCount === cards.length;
    if (done) {
      if (players === 2) {
        const winnerText = scores[0] === scores[1] ? "It's a tie!" : `Player ${scores[0] > scores[1] ? 1 : 2} wins!`;
        status.innerHTML = `<strong>${winnerText}</strong>`;
      } else {
        status.innerHTML = `Solved in <strong>${moves}</strong> moves!`;
      }
    } else if (players === 2) {
      status.innerHTML = `Turn: <strong class="${current === 0 ? 'p1' : 'p2'}">Player ${current+1}</strong>`;
    } else {
      status.innerHTML = `Moves: <strong>${moves}</strong>`;
    }

    if (players === 2) {
      container.querySelector('.score-row').classList.remove('hidden');
      container.querySelector('.p1').textContent = 'P1: ' + scores[0];
      container.querySelector('.p2').textContent = 'P2: ' + scores[1];
    } else {
      container.querySelector('.score-row').classList.add('hidden');
    }
  }

  function startWithPlayers(n) {
    players = n;
    container.querySelector('.mode-select').classList.add('hidden');
    container.querySelector('.memory-play').classList.remove('hidden');
    reset();
  }

  function mount(el) {
    container = el;
    container.innerHTML = `
      <div class="board-screen">
        <div class="mode-select overlay" style="position:relative; background:none;">
          <h1 style="font-size:26px;">MEMORY MATCH</h1>
          <p>How many players?</p>
          <button class="btn one-p-btn">1 PLAYER</button>
          <button class="btn ghost two-p-btn">2 PLAYERS (LOCAL)</button>
        </div>
        <div class="memory-play hidden" style="display:flex; flex-direction:column; align-items:center; gap:14px; width:100%;">
          <div class="score-row hidden"><div class="p1">P1: 0</div><div class="p2">P2: 0</div></div>
          <div class="memory-grid"></div>
          <div class="board-status">Moves: 0</div>
          <button class="btn ghost restart-btn">RESTART</button>
        </div>
      </div>
    `;
    container.querySelector('.one-p-btn').addEventListener('click', () => startWithPlayers(1));
    container.querySelector('.two-p-btn').addEventListener('click', () => startWithPlayers(2));
    container.querySelector('.restart-btn').addEventListener('click', reset);
  }

  function unmount() { container = null; }

  return { mount, unmount };
})();
