(function () {
  const REGISTRY = [
    { id: 'stardodger', name: 'Star Dodger', emoji: '🚀', desc: 'Dodge asteroids & chase your high score', players: '1 Player' },
    { id: 'snake', name: 'Snake', emoji: '🐍', desc: 'Eat, grow, don\'t hit yourself', players: '1 Player' },
    { id: 'twenty48', name: '2048', emoji: '🔢', desc: 'Swipe and merge to reach 2048', players: '1 Player' },
    { id: 'tictactoe', name: 'Tic Tac Toe', emoji: '❌', desc: 'The classic. Pass the phone.', players: '2 Player' },
    { id: 'connect4', name: '4 in a Row', emoji: '🔴', desc: 'Drop pieces, connect four to win', players: '2 Player' },
    { id: 'memory', name: 'Memory Match', emoji: '🃏', desc: 'Flip cards, find the pairs', players: '1-2 Player' },
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
      card.className = 'game-card';
      card.innerHTML = `
        <div class="game-card-emoji">${g.emoji}</div>
        <div class="game-card-name">${g.name}</div>
        <div class="game-card-desc">${g.desc}</div>
        <div class="game-card-players">${g.players}</div>
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
    topTitle.textContent = 'MINI ARCADE';
  }

  backBtn.addEventListener('click', goHome);

  renderGrid();
})();
