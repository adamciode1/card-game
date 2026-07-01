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
      addLog(state, `Nova Burst leaves ${state.enemy.name} scorched.`);
    },
  },
];


const REWARD_CARDS = [
  {
    id: 'meteor-lance',
    name: 'Meteor Lance',
    cost: 2,
    type: 'Attack',
    text: 'Deal 16 damage. If a gambit is pending, apply 1 marked first.',
    rewardText: 'Burst payoff for decks that arm gambits before attacking.',
    play(state) {
      if (state.gambits.length > 0) {
        state.enemy.status.marked += 1;
        addLog(state, 'Meteor Lance spots an opening from your pending gambit.');
      }
      const bonus = consumeMarkedBonus(state);
      dealDamage(state, 16 + bonus);
    },
  },
  {
    id: 'starlit-reprieve',
    name: 'Starlit Reprieve',
    cost: 1,
    type: 'Skill',
    text: 'Gain 6 block. Heal 3 HP if you have no marked status.',
    rewardText: 'Safer sustain for longer encounter chains.',
    play(state) {
      gainBlock(state, 6, 'Starlit Reprieve folds light into 6 block.');
      if (state.player.status.marked === 0) {
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 3);
        addLog(state, 'Clean starlight restores 3 HP.');
      }
    },
  },
  {
    id: 'ember-investment',
    name: 'Ember Investment',
    cost: 1,
    type: 'Gambit',
    text: 'Arm a gambit: next turn, gain 2 spark and draw 1 card.',
    rewardText: 'A tempo reward for players who plan one turn ahead.',
    play(state) {
      armGambit(state, {
        name: 'Ember Investment',
        turns: 1,
        description: '+2 spark + 1 draw',
        resolve(targetState) {
          targetState.player.energy += 2;
          drawCards(targetState, 1);
          addLog(targetState, 'Ember Investment pays out 2 spark and 1 card.');
        },
      });
    },
  },
  {
    id: 'void-suture',
    name: 'Void Suture',
    cost: 0,
    type: 'Hex',
    text: 'Apply 1 marked. If the enemy has scorch, draw 1 card.',
    rewardText: 'Links mark and scorch into a faster combo package.',
    play(state) {
      state.enemy.status.marked += 1;
      addLog(state, 'Void Suture pins a marked seam in the enemy.');
      if (state.enemy.status.scorch > 0) {
        drawCards(state, 1);
        addLog(state, 'Scorch lights the seam and draws 1 card.');
      }
    },
  },
];

const ENCOUNTERS = [
  {
    id: 'ember-wolf',
    name: 'Ember Wolf',
    archetype: 'Attacker / Disruptor',
    portrait: '🐺',
    maxHp: 56,
    intro: 'The Ember Wolf teaches intent timing: block heavy bites and punish setup turns.',
    mechanics: 'Marks you before bite turns; gains strength if left unchecked.',
    pattern: [
      { name: 'Claw Sweep', intent: 'Attack 8', damage: 8 },
      { name: 'Smoke Hide', intent: 'Block 7 + mark you', block: 7, playerMarked: 1 },
      { name: 'Ravenous Bite', intent: 'Attack 11', damage: 11 },
      { name: 'Kindle Fury', intent: 'Gain 2 strength', strength: 2 },
    ],
  },
  {
    id: 'aegis-moth',
    name: 'Aegis Moth',
    archetype: 'Defender',
    portrait: '🦋',
    maxHp: 64,
    intro: 'The Aegis Moth rewards saving burst damage for turns after its shell drops.',
    mechanics: 'Alternates large block turns with modest attacks and a cleansing molt.',
    pattern: [
      { name: 'Glasswing Guard', intent: 'Block 12', block: 12 },
      { name: 'Prism Dust', intent: 'Attack 7 + block 5', damage: 7, block: 5 },
      { name: 'Moonlit Molt', intent: 'Cleanse scorch + block 8', block: 8, cleanseScorch: true },
      { name: 'Wing Lash', intent: 'Attack 10', damage: 10 },
    ],
  },
  {
    id: 'hollow-oracle',
    name: 'Hollow Oracle',
    archetype: 'Summoner / Scaler',
    portrait: '🜁',
    maxHp: 70,
    intro: 'The Hollow Oracle pressures slow hands with orbiting wisps that grow its offense.',
    mechanics: 'Summons wisps; each wisp adds chip damage and empowers Starfall.',
    pattern: [
      { name: 'Call Wisps', intent: 'Summon 2 wisps', summons: 2 },
      { name: 'Wisp Barrage', intent: 'Attack 6 + wisps', damage: 6, minionAttack: true },
      { name: 'Dark Forecast', intent: 'Gain 2 strength + mark you', strength: 2, playerMarked: 1 },
      { name: 'Starfall Choir', intent: 'Attack 10 + wisps', damage: 10, minionAttack: true },
    ],
  },
  {
    id: 'solar-tyrant',
    name: 'Solar Tyrant',
    archetype: 'Boss Pattern',
    portrait: '☀',
    maxHp: 88,
    intro: 'The Solar Tyrant is a compact boss test with a readable three-turn burst cycle.',
    mechanics: 'Builds strength, shields before a flare, then unleashes a large attack.',
    pattern: [
      { name: 'Royal Decree', intent: 'Gain 3 strength', strength: 3 },
      { name: 'Solar Mantle', intent: 'Block 14 + mark you', block: 14, playerMarked: 1 },
      { name: 'Crown Flare', intent: 'Attack 16', damage: 16 },
      { name: 'Ashen Recovery', intent: 'Attack 8 + block 8', damage: 8, block: 8 },
    ],
  },
];

const app = document.querySelector('#app');
let state = createGame();
render();

function createGame() {
  const deck = CARD_LIBRARY.flatMap((card) =>
    Array.from({ length: card.copies }, () => createCardInstance(card)),
  );

  const initialState = {
    phase: 'player',
    turn: 1,
    player: { hp: 52, maxHp: 52, block: 0, energy: 3, maxEnergy: 3, status: { marked: 0 } },
    encounterIndex: 0,
    enemy: createEnemy(ENCOUNTERS[0]),
    deck: shuffle(deck),
    hand: [],
    discard: [],
    exhaust: [],
    gambits: [],
    log: [],
    message: ENCOUNTERS[0].intro,
    result: null,
    rewardOptions: [],
    rewardsClaimed: [],
  };

  drawCards(initialState, 5);
  addLog(initialState, `${initialState.enemy.name} appears. ${initialState.enemy.mechanics}`);
  return initialState;
}

function createEnemy(encounter) {
  return {
    ...encounter,
    hp: encounter.maxHp,
    block: 0,
    patternIndex: 0,
    wisps: 0,
    status: { marked: 0, scorch: 0, strength: 0 },
  };
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
  addLog(state, `${state.enemy.name} uses ${intent.name}.`);
  if (intent.block) {
    state.enemy.block += intent.block;
    addLog(state, `${state.enemy.name} gains ${intent.block} block.`);
  }
  if (intent.playerMarked) {
    state.player.status.marked += intent.playerMarked;
    addLog(state, `${state.enemy.name} marks you for its next attack.`);
  }
  if (intent.strength) {
    state.enemy.status.strength += intent.strength;
    addLog(state, `${state.enemy.name} gains ${intent.strength} strength.`);
  }
  if (intent.summons) {
    state.enemy.wisps += intent.summons;
    addLog(state, `${state.enemy.name} summons ${intent.summons} wisps.`);
  }
  if (intent.cleanseScorch && state.enemy.status.scorch > 0) {
    state.enemy.status.scorch = 0;
    addLog(state, `${state.enemy.name} cleanses its scorch.`);
  }
  if (intent.damage) {
    const markedBonus = consumePlayerMarkedBonus(state);
    const wispDamage = intent.minionAttack ? state.enemy.wisps * 2 : 0;
    if (wispDamage > 0) addLog(state, `Wisps add ${wispDamage} damage.`);
    takeDamage(state, intent.damage + state.enemy.status.strength + markedBonus + wispDamage);
  }
  state.enemy.patternIndex = (state.enemy.patternIndex + 1) % state.enemy.pattern.length;
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
  addLog(state, `${state.enemy.name} blocks ${blocked} and takes ${dealt} damage.`);
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
  addLog(state, `${state.enemy.name} consumes your mark for +3 damage.`);
  return 3;
}

function resolveScorch(state) {
  if (state.enemy.status.scorch <= 0) return;
  const scorchDamage = state.enemy.status.scorch;
  state.enemy.hp -= scorchDamage;
  addLog(state, `Scorch burns ${state.enemy.name} for ${scorchDamage} damage.`);
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
  return state.enemy.pattern[state.enemy.patternIndex];
}

function checkResult(state) {
  if (state.enemy.hp <= 0) {
    state.enemy.hp = 0;
    state.result = 'victory';
    const hasNext = state.encounterIndex < ENCOUNTERS.length - 1;
    if (hasNext && state.rewardOptions.length === 0) {
      state.phase = 'reward';
      state.rewardOptions = rollRewardOptions(state);
    }
    state.message = hasNext
      ? `Victory! Choose one reward before the next encounter.`
      : 'Victory! The short encounter sequence is complete.';
    addLog(state, `${state.enemy.name} defeated.`);
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


function createCardInstance(card) {
  return { ...card, instanceId: `${card.id}-${crypto.randomUUID()}` };
}

function rollRewardOptions(state) {
  const ownedRewardIds = new Set(state.rewardsClaimed.map((card) => card.id));
  const freshRewards = REWARD_CARDS.filter((card) => !ownedRewardIds.has(card.id));
  const rewardPool = freshRewards.length >= 3 ? freshRewards : REWARD_CARDS;
  return shuffle(rewardPool).slice(0, 3);
}

function render() {
  const intent = currentIntent(state);
  app.innerHTML = `
    <section class="hero-panel">
      <div>
        <p class="eyebrow">Session 5 Progression & Rewards</p>
        <h1>Astral Gambit</h1>
        <p class="subtitle">Win encounters, choose rewards, and shape your deck during the run.</p>
      </div>
      <div class="controls">
        <button class="secondary" data-action="debug-draw">Debug Draw</button>
        <button class="secondary" data-action="debug-energy">+1 Spark</button>
        <button data-action="restart">Restart Run</button>
      </div>
    </section>

    <section class="battlefield">
      ${combatantTemplate('Player', state.player.hp, state.player.maxHp, state.player.block, `${state.player.energy}/${state.player.maxEnergy} spark`, 'player-card', '✦', playerStatusTemplate())}
      <div class="turn-panel">
        <p class="eyebrow">Encounter ${state.encounterIndex + 1}/${ENCOUNTERS.length} · Turn ${state.turn}</p>
        <h2>${state.message}</h2>
        <div class="intent-card" aria-label="Enemy intent">
          <span class="intent-icon" aria-hidden="true">${intentIcon(intent)}</span>
          <p>Enemy intent: <strong>${intent.intent}</strong></p>
        </div>
        ${gambitTemplate()}
        ${progressionTemplate()}
        ${rewardTemplate()}
        ${resultActionTemplate()}
      </div>
      ${combatantTemplate(state.enemy.name, state.enemy.hp, state.enemy.maxHp, state.enemy.block, state.enemy.archetype, 'enemy-card', state.enemy.portrait, enemyStatusTemplate())}
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
  app.querySelector('[data-action="next-encounter"]')?.addEventListener('click', nextEncounter);
  app.querySelectorAll('[data-reward-id]').forEach((button) => {
    button.addEventListener('click', () => chooseReward(button.dataset.rewardId));
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

function nextEncounter() {
  if (state.result !== 'victory' || state.encounterIndex >= ENCOUNTERS.length - 1) return;
  state.encounterIndex += 1;
  state.enemy = createEnemy(ENCOUNTERS[state.encounterIndex]);
  state.phase = 'player';
  state.result = null;
  state.rewardOptions = [];
  state.turn = 1;
  state.player.block = 0;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + 18);
  state.player.energy = state.player.maxEnergy;
  state.player.status.marked = 0;
  state.gambits = [];
  state.discard.push(...state.hand.splice(0));
  state.discard.push(...state.deck.splice(0));
  state.deck = shuffle(state.discard.splice(0));
  drawCards(state, 5);
  state.message = state.enemy.intro;
  addLog(state, `${state.enemy.name} appears. ${state.enemy.mechanics}`);
  addLog(state, 'A brief respite restores up to 18 HP.');
  render();
}


function chooseReward(cardId) {
  if (state.result !== 'victory' || state.rewardOptions.length === 0) return;
  const reward = state.rewardOptions.find((card) => card.id === cardId);
  if (!reward) return;
  state.discard.push(createCardInstance(reward));
  state.rewardsClaimed.push(reward);
  state.rewardOptions = [];
  state.message = `${reward.name} added to your discard pile. Continue when ready.`;
  addLog(state, `Reward claimed: ${reward.name}.`);
  render();
}

function progressionTemplate() {
  const claimed = state.rewardsClaimed.map((card) => card.name).join(' · ') || 'No rewards claimed yet';
  return `<p class="progression-chip">Run rewards: ${claimed}</p>`;
}

function rewardTemplate() {
  if (state.rewardOptions.length === 0) return '';
  return `
    <div class="reward-panel" aria-label="Card rewards">
      <p class="eyebrow">Choose one card reward</p>
      <div class="reward-grid">
        ${state.rewardOptions.map(rewardCardTemplate).join('')}
      </div>
    </div>
  `;
}

function rewardCardTemplate(card) {
  return `
    <button class="reward-card" data-reward-id="${card.id}" data-type="${card.type}">
      <span class="card-topline">
        <span class="cost">${card.cost}</span>
        <span class="type">${card.type}</span>
      </span>
      <strong>${card.name}</strong>
      <p>${card.text}</p>
      <small>${card.rewardText}</small>
    </button>
  `;
}

function resultActionTemplate() {
  if (state.result === 'victory' && state.encounterIndex < ENCOUNTERS.length - 1) {
    const disabled = state.rewardOptions.length > 0 ? 'disabled' : '';
    return `<button class="end-turn" data-action="next-encounter" ${disabled}>Next Encounter</button>`;
  }
  return `<button class="end-turn" data-action="end-turn" ${state.result ? 'disabled' : ''}>End Turn</button>`;
}

function combatantTemplate(name, hp, maxHp, block, detail, className, portrait, statusMarkup = '') {
  const hpPercent = Math.max(0, (hp / maxHp) * 100);
  return `
    <article class="combatant ${className}">
      <div class="combatant-header">
        <h2>${name}</h2>
        <span class="portrait" aria-hidden="true">${portrait}</span>
      </div>
      <div class="hp-bar" aria-label="${name} health">
        <span style="width: ${hpPercent}%"></span>
      </div>
      <div class="stat-grid">
        <p class="stat-pill"><strong>${hp}/${maxHp}</strong> HP</p>
        <p class="stat-pill"><strong>${block}</strong> Block</p>
      </div>
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
    <button class="card" data-card-id="${card.instanceId}" data-type="${card.type}" ${disabled ? 'disabled' : ''}>
      <span class="card-topline">
        <span class="cost">${card.cost}</span>
        <span class="type">${card.type}</span>
      </span>
      <span class="card-art" aria-hidden="true">${cardGlyph(card.type)}</span>
      <strong>${card.name}</strong>
      <p>${card.text}</p>
    </button>
  `;
}


function intentIcon(intent) {
  if (intent.damage) return '⚔';
  if (intent.block) return '◆';
  if (intent.strength) return '▲';
  return '✦';
}

function cardGlyph(type) {
  const glyphs = {
    Attack: '☄',
    Skill: '◈',
    Tactic: '✦',
    Hex: '◌',
    Gambit: '☾',
  };
  return glyphs[type] ?? '✦';
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
    ['Wisps', state.enemy.wisps],
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
