import './styles.css';

const CARD_LIBRARY = [
  {
    id: 'star-strike',
    name: 'Star Strike',
    cost: 1,
    type: 'Attack',
    text: 'Deal 6 damage. If the enemy is marked, deal +4 damage.',
    copies: 3,
    play(state) {
      const bonus = consumeMarkedBonus(state);
      dealDamage(state, 6 + bonus);
    },
  },
  {
    id: 'moon-ward',
    name: 'Moon Ward',
    cost: 1,
    type: 'Skill',
    text: 'Gain 7 block. Gain 2 more block if a gambit is pending.',
    copies: 3,
    play(state) {
      const gambitBonus = state.gambits.length > 0 ? 2 : 0;
      gainBlock(state, 7 + gambitBonus, `Moon Ward raises a silver shield for ${7 + gambitBonus} block.`);
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
    id: 'astral-mark',
    name: 'Astral Mark',
    cost: 1,
    type: 'Hex',
    text: 'Apply 1 marked. The next attack against a marked enemy deals +4 damage.',
    copies: 2,
    play(state) {
      state.enemy.status.marked += 1;
      addLog(state, 'Astral Mark paints a weak point in starlight.');
    },
  },
  {
    id: 'eclipse-gambit',
    name: 'Eclipse Gambit',
    cost: 1,
    type: 'Gambit',
    text: 'Arm a gambit: at the start of your next turn, deal 12 damage and gain 1 spark.',
    copies: 2,
    play(state) {
      armGambit(state, {
        name: 'Eclipse Gambit',
        turns: 1,
        description: '12 damage + 1 spark',
        resolve(targetState) {
          addLog(targetState, 'Eclipse Gambit springs from the shadows.');
          dealDamage(targetState, 12);
          targetState.player.energy += 1;
          addLog(targetState, 'The gambit refunds 1 spark.');
        },
      });
    },
  },
  {
    id: 'nova-burst',
    name: 'Nova Burst',
    cost: 2,
    type: 'Attack',
    text: 'Deal 12 damage. Apply 2 scorch.',
    copies: 1,
    play(state) {
      const bonus = consumeMarkedBonus(state);
      dealDamage(state, 12 + bonus);
      state.enemy.status.scorch += 2;
      addLog(state, 'Nova Burst leaves the Ember Wolf scorched.');
    },
  },
];

const ENEMY_PATTERN = [
  { name: 'Claw Sweep', intent: 'Attack 8', damage: 8 },
  { name: 'Smoke Hide', intent: 'Block 7 + mark you', block: 7, playerMarked: 1 },
  { name: 'Ravenous Bite', intent: 'Attack 11', damage: 11 },
  { name: 'Kindle Fury', intent: 'Gain 2 strength', strength: 2 },
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
    player: { hp: 52, maxHp: 52, block: 0, energy: 3, maxEnergy: 3, status: { marked: 0 } },
    enemy: { name: 'Ember Wolf', hp: 56, maxHp: 56, block: 0, patternIndex: 0, status: { marked: 0, scorch: 0, strength: 0 } },
    deck: shuffle(deck),
    hand: [],
    discard: [],
    exhaust: [],
    gambits: [],
    log: [],
    message: 'Stack marks, defend while gambits arm, and burst down the Ember Wolf.',
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
  if (intent.playerMarked) {
    state.player.status.marked += intent.playerMarked;
    addLog(state, 'Smoke Hide marks you for the wolf\'s next attack.');
  }
  if (intent.strength) {
    state.enemy.status.strength += intent.strength;
    addLog(state, `Ember Wolf gains ${intent.strength} strength.`);
  }
  if (intent.damage) {
    const markedBonus = consumePlayerMarkedBonus(state);
    takeDamage(state, intent.damage + state.enemy.status.strength + markedBonus);
  }
  state.enemy.patternIndex = (state.enemy.patternIndex + 1) % ENEMY_PATTERN.length;
}

function startPlayerTurn() {
  state.phase = 'player';
  state.turn += 1;
  state.player.energy = state.player.maxEnergy;
  state.player.block = 0;
  state.enemy.block = 0;
  resolveScorch(state);
  tickGambits(state);
  drawCards(state, 5);
  checkResult(state);
  state.message = state.result ? state.message : `Turn ${state.turn}: mark targets, set gambits, or defend.`;
}

function gainBlock(state, amount, message) {
  state.player.block += amount;
  addLog(state, message);
}

function dealDamage(state, amount) {
  const blocked = Math.min(state.enemy.block, amount);
  const dealt = amount - blocked;
  state.enemy.block -= blocked;
  state.enemy.hp -= dealt;
  addLog(state, `Ember Wolf blocks ${blocked} and takes ${dealt} damage.`);
}

function takeDamage(state, amount) {
  const blocked = Math.min(state.player.block, amount);
  const taken = amount - blocked;
  state.player.block -= blocked;
  state.player.hp -= taken;
  addLog(state, `You block ${blocked} and take ${taken} damage.`);
}

function consumeMarkedBonus(state) {
  if (state.enemy.status.marked <= 0) return 0;
  state.enemy.status.marked -= 1;
  addLog(state, 'Astral Mark detonates for +4 attack damage.');
  return 4;
}

function consumePlayerMarkedBonus(state) {
  if (state.player.status.marked <= 0) return 0;
  state.player.status.marked -= 1;
  addLog(state, 'The wolf consumes your mark for +3 damage.');
  return 3;
}

function resolveScorch(state) {
  if (state.enemy.status.scorch <= 0) return;
  const scorchDamage = state.enemy.status.scorch;
  state.enemy.hp -= scorchDamage;
  addLog(state, `Scorch burns the Ember Wolf for ${scorchDamage} damage.`);
}

function armGambit(state, gambit) {
  state.gambits.push(gambit);
  addLog(state, `${gambit.name} is armed for next turn.`);
}

function tickGambits(state) {
  const resolving = [];
  state.gambits.forEach((gambit) => {
    gambit.turns -= 1;
    if (gambit.turns <= 0) resolving.push(gambit);
  });
  state.gambits = state.gambits.filter((gambit) => gambit.turns > 0);
  resolving.forEach((gambit) => gambit.resolve(state));
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
  state.log = state.log.slice(0, 10);
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
        <p class="eyebrow">Session 2 Prototype</p>
        <h1>Astral Gambit</h1>
        <p class="subtitle">Mark enemies, arm delayed gambits, and time your defenses around readable intents.</p>
      </div>
      <div class="controls">
        <button class="secondary" data-action="debug-draw">Debug Draw</button>
        <button class="secondary" data-action="debug-energy">+1 Spark</button>
        <button data-action="restart">Restart Encounter</button>
      </div>
    </section>

    <section class="battlefield">
      ${combatantTemplate('Player', state.player.hp, state.player.maxHp, state.player.block, `${state.player.energy}/${state.player.maxEnergy} spark`, 'player-card', playerStatusTemplate())}
      <div class="turn-panel">
        <p class="eyebrow">Turn ${state.turn}</p>
        <h2>${state.message}</h2>
        <p>Enemy intent: <strong>${intent.intent}</strong></p>
        ${gambitTemplate()}
        <button class="end-turn" data-action="end-turn" ${state.result ? 'disabled' : ''}>End Turn</button>
      </div>
      ${combatantTemplate(state.enemy.name, state.enemy.hp, state.enemy.maxHp, state.enemy.block, intent.intent, 'enemy-card', enemyStatusTemplate())}
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

function combatantTemplate(name, hp, maxHp, block, detail, className, statusMarkup = '') {
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
      ${statusMarkup}
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

function gambitTemplate() {
  if (state.gambits.length === 0) return '<p class="gambit-empty">No gambits armed.</p>';
  return `
    <div class="gambit-row" aria-label="Armed gambits">
      ${state.gambits.map((gambit) => `<span>${gambit.name}: ${gambit.description}</span>`).join('')}
    </div>
  `;
}

function enemyStatusTemplate() {
  return statusListTemplate([
    ['Marked', state.enemy.status.marked],
    ['Scorch', state.enemy.status.scorch],
    ['Strength', state.enemy.status.strength],
  ]);
}

function playerStatusTemplate() {
  return statusListTemplate([['Marked', state.player.status.marked]]);
}

function statusListTemplate(entries) {
  const activeEntries = entries.filter(([, value]) => value > 0);
  if (activeEntries.length === 0) return '<p class="status-empty">No statuses</p>';
  return `<div class="status-list">${activeEntries.map(([label, value]) => `<span>${label} ${value}</span>`).join('')}</div>`;
}
