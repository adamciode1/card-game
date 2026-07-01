import './styles.css';

const CARD_LIBRARY = [
  {
    id: 'star-strike',
    name: 'Star Strike',
    cost: 1,
    type: 'Attack',
    text: 'Deal 7 damage.',
    copies: 4,
    play(state) {
      dealDamage(state, 7);
    },
  },
  {
    id: 'moon-ward',
    name: 'Moon Ward',
    cost: 1,
    type: 'Skill',
    text: 'Gain 6 block.',
    copies: 3,
    play(state) {
      state.player.block += 6;
      addLog(state, 'Moon Ward raises a silver shield for 6 block.');
    },
  },
  {
    id: 'comet-draw',
    name: 'Comet Draw',
    cost: 0,
    type: 'Tactic',
    text: 'Draw 1 card. Gain 1 spark.',
    copies: 2,
    play(state) {
      drawCards(state, 1);
      state.player.energy += 1;
      addLog(state, 'Comet Draw refreshes your hand and restores 1 spark.');
    },
  },
  {
    id: 'nova-burst',
    name: 'Nova Burst',
    cost: 2,
    type: 'Attack',
    text: 'Deal 13 damage. Lose 2 block.',
    copies: 1,
    play(state) {
      dealDamage(state, 13);
      state.player.block = Math.max(0, state.player.block - 2);
      addLog(state, 'The nova recoil strips away 2 block.');
    },
  },
];

const ENEMY_PATTERN = [
  { name: 'Claw Sweep', intent: 'Attack 8', damage: 8 },
  { name: 'Guard Up', intent: 'Block 6', block: 6 },
  { name: 'Ravenous Bite', intent: 'Attack 12', damage: 12 },
];

const app = document.querySelector('#app');
let state = createGame();
render();

function createGame() {
  const deck = CARD_LIBRARY.flatMap((card) =>
    Array.from({ length: card.copies }, (_, copy) => ({ ...card, instanceId: `${card.id}-${copy}-${crypto.randomUUID()}` })),
  );

  const initialState = {
    phase: 'player',
    turn: 1,
    player: { hp: 48, maxHp: 48, block: 0, energy: 3, maxEnergy: 3 },
    enemy: { name: 'Ember Wolf', hp: 42, maxHp: 42, block: 0, patternIndex: 0 },
    deck: shuffle(deck),
    hand: [],
    discard: [],
    exhaust: [],
    log: [],
    message: 'Draw your opening hand and defeat the Ember Wolf.',
    result: null,
  };

  drawCards(initialState, 5);
  addLog(initialState, 'Encounter begins. Your stars flare to life.');
  return initialState;
}

function playCard(instanceId) {
  if (state.result || state.phase !== 'player') return;
  const handIndex = state.hand.findIndex((card) => card.instanceId === instanceId);
  const card = state.hand[handIndex];
  if (!card) return;
  if (card.cost > state.player.energy) {
    state.message = `Not enough spark to play ${card.name}.`;
    render();
    return;
  }

  state.player.energy -= card.cost;
  state.hand.splice(handIndex, 1);
  addLog(state, `You play ${card.name}.`);
  card.play(state);
  state.discard.push(card);
  checkResult(state);
  render();
}

function endTurn() {
  if (state.result || state.phase !== 'player') return;
  state.phase = 'enemy';
  state.message = 'The Ember Wolf acts.';
  state.discard.push(...state.hand.splice(0));
  runEnemyTurn();
  checkResult(state);
  if (!state.result) startPlayerTurn();
  render();
}

function runEnemyTurn() {
  const intent = currentIntent(state);
  addLog(state, `Ember Wolf uses ${intent.name}.`);
  if (intent.block) {
    state.enemy.block += intent.block;
    addLog(state, `Ember Wolf gains ${intent.block} block.`);
  }
  if (intent.damage) {
    const blocked = Math.min(state.player.block, intent.damage);
    const taken = intent.damage - blocked;
    state.player.block -= blocked;
    state.player.hp -= taken;
    addLog(state, `You block ${blocked} and take ${taken} damage.`);
  }
  state.enemy.patternIndex = (state.enemy.patternIndex + 1) % ENEMY_PATTERN.length;
}

function startPlayerTurn() {
  state.phase = 'player';
  state.turn += 1;
  state.player.energy = state.player.maxEnergy;
  state.player.block = 0;
  state.enemy.block = 0;
  drawCards(state, 5);
  state.message = `Turn ${state.turn}: choose your cards carefully.`;
}

function dealDamage(state, amount) {
  const blocked = Math.min(state.enemy.block, amount);
  const dealt = amount - blocked;
  state.enemy.block -= blocked;
  state.enemy.hp -= dealt;
  addLog(state, `Ember Wolf blocks ${blocked} and takes ${dealt} damage.`);
}

function drawCards(state, count) {
  for (let i = 0; i < count; i += 1) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) return;
      state.deck = shuffle(state.discard.splice(0));
      addLog(state, 'Discard is shuffled into a new deck.');
    }
    state.hand.push(state.deck.pop());
  }
}

function currentIntent(state) {
  return ENEMY_PATTERN[state.enemy.patternIndex];
}

function checkResult(state) {
  if (state.enemy.hp <= 0) {
    state.enemy.hp = 0;
    state.result = 'victory';
    state.message = 'Victory! The Ember Wolf dissolves into starlight.';
    addLog(state, 'Encounter won.');
  } else if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.result = 'defeat';
    state.message = 'Defeat. The constellation fades, but you can try again.';
    addLog(state, 'Encounter lost.');
  }
}

function addLog(state, message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 8);
}

function shuffle(cards) {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function render() {
  const intent = currentIntent(state);
  app.innerHTML = `
    <section class="hero-panel">
      <div>
        <p class="eyebrow">Session 1 Prototype</p>
        <h1>Astral Gambit</h1>
        <p class="subtitle">Play cards, manage spark, and survive a compact test encounter.</p>
      </div>
      <div class="controls">
        <button class="secondary" data-action="debug-draw">Debug Draw</button>
        <button class="secondary" data-action="debug-energy">+1 Spark</button>
        <button data-action="restart">Restart Encounter</button>
      </div>
    </section>

    <section class="battlefield">
      ${combatantTemplate('Player', state.player.hp, state.player.maxHp, state.player.block, `${state.player.energy}/${state.player.maxEnergy} spark`, 'player-card')}
      <div class="turn-panel">
        <p class="eyebrow">Turn ${state.turn}</p>
        <h2>${state.message}</h2>
        <p>Enemy intent: <strong>${intent.intent}</strong></p>
        <button class="end-turn" data-action="end-turn" ${state.result ? 'disabled' : ''}>End Turn</button>
      </div>
      ${combatantTemplate(state.enemy.name, state.enemy.hp, state.enemy.maxHp, state.enemy.block, intent.intent, 'enemy-card')}
    </section>

    <section class="zones">
      ${zoneTemplate('Draw', state.deck.length)}
      ${zoneTemplate('Discard', state.discard.length)}
      ${zoneTemplate('Exhaust', state.exhaust.length)}
    </section>

    <section class="hand" aria-label="Player hand">
      ${state.hand.map(cardTemplate).join('') || '<p class="empty-hand">No cards in hand.</p>'}
    </section>

    <section class="log-panel">
      <h2>Combat Log</h2>
      <ol>${state.log.map((entry) => `<li>${entry}</li>`).join('')}</ol>
    </section>
  `;

  app.querySelectorAll('[data-card-id]').forEach((button) => {
    button.addEventListener('click', () => playCard(button.dataset.cardId));
  });
  app.querySelector('[data-action="end-turn"]')?.addEventListener('click', endTurn);
  app.querySelector('[data-action="restart"]')?.addEventListener('click', () => {
    state = createGame();
    render();
  });
  app.querySelector('[data-action="debug-draw"]')?.addEventListener('click', () => {
    drawCards(state, 1);
    state.message = 'Debug draw added a card to your hand.';
    render();
  });
  app.querySelector('[data-action="debug-energy"]')?.addEventListener('click', () => {
    state.player.energy += 1;
    state.message = 'Debug tool added 1 spark.';
    render();
  });
}

function combatantTemplate(name, hp, maxHp, block, detail, className) {
  const hpPercent = Math.max(0, (hp / maxHp) * 100);
  return `
    <article class="combatant ${className}">
      <h2>${name}</h2>
      <div class="hp-bar" aria-label="${name} health">
        <span style="width: ${hpPercent}%"></span>
      </div>
      <p><strong>${hp}/${maxHp}</strong> HP</p>
      <p><strong>${block}</strong> Block</p>
      <p class="detail">${detail}</p>
    </article>
  `;
}

function zoneTemplate(label, count) {
  return `
    <article class="zone">
      <span>${label}</span>
      <strong>${count}</strong>
    </article>
  `;
}

function cardTemplate(card) {
  const disabled = state.result || card.cost > state.player.energy;
  return `
    <button class="card" data-card-id="${card.instanceId}" ${disabled ? 'disabled' : ''}>
      <span class="cost">${card.cost}</span>
      <span class="type">${card.type}</span>
      <strong>${card.name}</strong>
      <p>${card.text}</p>
    </button>
  `;
}
