(function () {
  const REGISTRY = [
    { id: 'stardodger', sku: 'SD-01', color: 'var(--cart-teal)', name: 'Star Dodger', emoji: '🚀', desc: 'Dodge asteroids & chase your high score', players: '1 PLAYER' },
    { id: 'snake', sku: 'SN-02', color: 'var(--cart-moss)', name: 'Snake', emoji: '🐍', desc: "Eat, grow, don't hit yourself", players: '1 PLAYER' },
    { id: 'twenty48', sku: 'TF-03', color: 'var(--cart-blue)', name: '2048', emoji: '🔢', desc: 'Swipe and merge to reach 2048', players: '1 PLAYER' },
    { id: 'tictactoe', sku: 'TT-04', color: 'var(--cart-rust)', name: 'Tic Tac Toe', emoji: '❌', desc: 'The classic. Pass the phone.', players: '2 PLAYER' },
    { id: 'connect4', sku: 'C4-05', color: 'var(--cart-plum)', name: '4 in a Row', emoji: '🔴', desc: 'Drop pieces, connect four to win', players: '2 PLAYER' },
    { id: 'memory', sku: 'MM-06', color: 'var(--cart-gold)', name: 'Memory Match', emoji: '🃏', desc: 'Flip cards, find the pairs', players: '1-2 PLAYER' },
  ];

  const homeScreen = document.getElementById('home');
  const gameContainer = document.getElementById('gameContainer');
  const gameGrid = document.getElementById('gameGrid');
  const backBtn = document.getElementById('backBtn');
  const topTitle = document.getElementById('topTitle');

  let activeGame = null;

  function renderGrid() {
    gameGrid.innerHTML = '';
    for (const g of REGISTRY) {
      const card = document.createElement('button');
      card.className = 'cartridge';
      card.style.setProperty('--cart-color', g.color);
      card.innerHTML = `
        <div class="cartridge-label">
          <div class="cartridge-emoji">${g.emoji}</div>
          <div class="cartridge-name">${g.name}</div>
          <div class="cartridge-sku">${g.sku}</div>
        </div>
        <div class="cartridge-body">
          <div class="cartridge-desc">${g.desc}</div>
          <div class="cartridge-players">${g.players}</div>
        </div>
        <div class="cartridge-ridges"></div>
      `;
      card.addEventListener('click', () => openGame(g));
      gameGrid.appendChild(card);
    }
  }

  function openGame(g) {
    const mod = window.Games && window.Games[g.id];
    if (!mod) return;
    activeGame = mod;
    topTitle.textContent = g.name.toUpperCase();
    backBtn.classList.remove('hidden');
    homeScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    gameContainer.innerHTML = '';
    mod.mount(gameContainer);
  }

  function goHome() {
    if (activeGame && activeGame.unmount) {
      try { activeGame.unmount(); } catch (e) { /* ignore */ }
    }
    activeGame = null;
    gameContainer.innerHTML = '';
    gameContainer.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    backBtn.classList.add('hidden');
    topTitle.textContent = 'POCKET ARCADE';
  }

  backBtn.textContent = '◀ BACK';
  backBtn.addEventListener('click', goHome);

  renderGrid();
})();
