import './styles.css';
import astralAssetsUrl from './assets/astral-assets.svg';

const CARD_LIBRARY = [
  {
    id: 'star-strike',
    name: 'Star Strike',
    cost: 1,
    type: 'Attack',
    text: 'Deal 6 damage. If the enemy is marked, deal +4 damage.',
    archetype: 'Starblade',
    rarity: 'Starter',
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
    archetype: 'Lunar Guard',
    rarity: 'Starter',
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
    archetype: 'Comet Tempo',
    rarity: 'Starter',
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
    archetype: 'Void Hex',
    rarity: 'Starter',
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
    archetype: 'Eclipse Gambit',
    rarity: 'Starter',
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
    archetype: 'Solar Flare',
    rarity: 'Starter',
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
    archetype: 'Starblade',
    rarity: 'Uncommon',
    text: 'Deal 16 damage. If a gambit is pending, apply 1 marked first.',
    rewardText: 'Starblade burst that rewards setting up a delayed strike.',
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
    id: 'constellation-cut',
    name: 'Constellation Cut',
    cost: 1,
    type: 'Attack',
    archetype: 'Starblade',
    rarity: 'Common',
    text: 'Deal 7 damage. Draw 1 card if this consumes marked.',
    rewardText: 'Keeps Starblade mark turns moving without adding complexity.',
    play(state) {
      const hadMark = state.enemy.status.marked > 0;
      const bonus = consumeMarkedBonus(state);
      dealDamage(state, 7 + bonus);
      if (hadMark) {
        drawCards(state, 1);
        addLog(state, 'Constellation Cut follows the marked line into 1 draw.');
      }
    },
  },
  {
    id: 'starlit-reprieve',
    name: 'Starlit Reprieve',
    cost: 1,
    type: 'Skill',
    archetype: 'Lunar Guard',
    rarity: 'Common',
    text: 'Gain 6 block. Heal 3 HP if you have no marked status.',
    rewardText: 'Lunar Guard sustain for longer encounter chains.',
    play(state) {
      gainBlock(state, 6, 'Starlit Reprieve folds light into 6 block.');
      if (state.player.status.marked === 0) {
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 3);
        addLog(state, 'Clean starlight restores 3 HP.');
      }
    },
  },
  {
    id: 'mirror-aegis',
    name: 'Mirror Aegis',
    cost: 2,
    type: 'Skill',
    archetype: 'Lunar Guard',
    rarity: 'Uncommon',
    text: 'Gain 12 block. If the enemy is marked, gain 1 spark.',
    rewardText: 'A defensive bridge between guard and mark strategies.',
    play(state) {
      gainBlock(state, 12, 'Mirror Aegis forms a bright 12 block shell.');
      if (state.enemy.status.marked > 0) {
        state.player.energy += 1;
        addLog(state, 'The marked reflection returns 1 spark.');
      }
    },
  },
  {
    id: 'ember-investment',
    name: 'Ember Investment',
    cost: 1,
    type: 'Gambit',
    archetype: 'Eclipse Gambit',
    rarity: 'Common',
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
    id: 'eclipse-repeat',
    name: 'Eclipse Repeat',
    cost: 1,
    type: 'Gambit',
    archetype: 'Eclipse Gambit',
    rarity: 'Rare',
    text: 'Arm a gambit: next turn, deal 8 damage twice.',
    rewardText: 'A rare gambit payoff that is exciting but readable.',
    play(state) {
      armGambit(state, {
        name: 'Eclipse Repeat',
        turns: 1,
        description: '8 damage twice',
        resolve(targetState) {
          addLog(targetState, 'Eclipse Repeat echoes through the enemy.');
          dealDamage(targetState, 8);
          dealDamage(targetState, 8);
        },
      });
    },
  },
  {
    id: 'void-suture',
    name: 'Void Suture',
    cost: 0,
    type: 'Hex',
    archetype: 'Void Hex',
    rarity: 'Common',
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
  {
    id: 'solar-kindling',
    name: 'Solar Kindling',
    cost: 1,
    type: 'Tactic',
    archetype: 'Solar Flare',
    rarity: 'Uncommon',
    text: 'Apply 2 scorch. If a gambit is pending, draw 1 card.',
    rewardText: 'Cross-archetype fuel for scorch and gambit hybrids.',
    play(state) {
      state.enemy.status.scorch += 2;
      addLog(state, `${state.enemy.name} is kindled with 2 scorch.`);
      if (state.gambits.length > 0) {
        drawCards(state, 1);
        addLog(state, 'The pending gambit turns kindling into 1 draw.');
      }
    },
  },
  {
    id: 'supernova-vow',
    name: 'Supernova Vow',
    cost: 3,
    type: 'Attack',
    archetype: 'Solar Flare',
    rarity: 'Rare',
    text: 'Deal 20 damage. Apply 3 scorch. Take 3 damage.',
    rewardText: 'A rare risk/reward finisher for aggressive Solar Flare decks.',
    play(state) {
      const bonus = consumeMarkedBonus(state);
      dealDamage(state, 20 + bonus);
      state.enemy.status.scorch += 3;
      takeDamage(state, 3);
      addLog(state, 'Supernova Vow burns bright: 3 enemy scorch and 3 recoil damage.');
    },
  },
];

const ENCOUNTERS = [
  {
    id: 'ember-wolf',
    name: 'Ember Wolf',
    archetype: 'Attacker / Disruptor',
    portrait: '🐺',
    assetId: 'enemy-wolf',
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
    assetId: 'enemy-moth',
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
    assetId: 'enemy-oracle',
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
    assetId: 'enemy-tyrant',
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


const BALANCE_NOTES = [
  'Target: opening fight should end around turns 3-5 with 36+ HP for most clean wins.',
  'Target: safe route should preserve more HP; elite route may cost HP but grants a fourth reward choice.',
  'Watch: boss losses should come from missed block/setup windows, not hidden damage spikes.',
];

const RUN_MAP = [
  [
    { id: 'ember-trail', type: 'combat', label: 'Opening Fight', detail: 'A fair first battle to start the route.', encounterId: 'ember-wolf' },
  ],
  [
    { id: 'aegis-crossing', type: 'combat', label: 'Safe Fight', detail: 'Fight the Aegis Moth and preserve HP for the boss.', encounterId: 'aegis-moth' },
    { id: 'oracle-elite', type: 'elite', label: 'Elite Fight', detail: 'Face the Hollow Oracle for an extra card reward.', encounterId: 'hollow-oracle', bonusReward: true },
  ],
  [
    { id: 'moonwell-rest', type: 'rest', label: 'Rest Site', detail: 'Recover 16 HP before the finale.' },
    { id: 'forge-upgrade', type: 'upgrade', label: 'Upgrade Shrine', detail: 'Gain +1 max spark for the rest of the run.' },
    { id: 'comet-cache', type: 'event', label: 'Comet Cache', detail: 'Add a random reward card without another fight.' },
  ],
  [
    { id: 'solar-throne', type: 'boss', label: 'Boss', detail: 'Challenge the Solar Tyrant and complete the mini-run.', encounterId: 'solar-tyrant' },
  ],
];

const ENCOUNTER_BY_ID = Object.fromEntries(ENCOUNTERS.map((encounter) => [encounter.id, encounter]));
const DEFAULT_SETTINGS = {
  animationSpeed: 1,
  textScale: 1,
  volume: 70,
};
const SETTINGS_STORAGE_KEY = 'astral-gambit-settings';

const TUTORIAL_STEPS = [
  'Play cards with spark: attacks damage enemies, skills create block, and tactics keep turns moving.',
  'Watch enemy intent before ending your turn; block heavy attacks and use setup turns to mark or arm gambits.',
  'After each non-final victory, choose one card reward, open the map, and keep the mini-run route short and readable.',
];

const RELEASE_CHECKLIST = [
  'Playable from main menu through victory or defeat.',
  'Tutorial, shortcuts, glossary, settings, and credits are visible in-game.',
  'Known issues are listed before sharing the prototype externally.',
];

const KNOWN_ISSUES = [
  'Audio is represented by a saved volume preference only; final sound assets are not included yet.',
  'Balance targets are still based on local repeated-run notes and need external player feedback.',
];

const app = document.querySelector('#app');
let state = createGame();
window.addEventListener('keydown', handleKeyboardShortcuts);
render();

function createGame() {
  const deck = CARD_LIBRARY.flatMap((card) =>
    Array.from({ length: card.copies }, () => createCardInstance(card)),
  );

  const initialState = {
    screen: 'menu',
    phase: 'player',
    turn: 1,
    player: { hp: 52, maxHp: 52, block: 0, energy: 3, maxEnergy: 3, status: { marked: 0 } },
    mapStep: 0,
    currentNode: RUN_MAP[0][0],
    routeHistory: [RUN_MAP[0][0]],
    enemy: createEnemy(ENCOUNTER_BY_ID[RUN_MAP[0][0].encounterId]),
    deck: shuffle(deck),
    hand: [],
    discard: [],
    exhaust: [],
    gambits: [],
    log: [],
    message: ENCOUNTER_BY_ID[RUN_MAP[0][0].encounterId].intro,
    result: null,
    rewardOptions: [],
    rewardsClaimed: [],
    settings: loadSettings(),
    settingsOpen: false,
    tutorialOpen: false,
    creditsOpen: false,
  };

  drawCards(initialState, 5);
  addLog(initialState, `${initialState.enemy.name} appears. ${initialState.enemy.mechanics}`);
  addLog(initialState, 'The mini-run begins: win battles, choose rewards, then pick a route node.');
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

function playHandIndex(index) {
  const card = state.hand[index];
  if (card) playCard(card.instanceId);
}

function endTurn() {
  if (state.result || state.phase !== 'player') return;
  state.phase = 'enemy';
  state.message = `${state.enemy.name} acts.`;
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
    const hasNextNode = state.mapStep < RUN_MAP.length - 1;
    if (hasNextNode && state.rewardOptions.length === 0) {
      state.phase = 'reward';
      state.rewardOptions = rollRewardOptions(state);
    }
    state.message = hasNextNode
      ? 'Victory! Choose one card reward, then open the map.'
      : 'Victory! The mini-run is complete.';
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
  return shuffle(rewardPool).slice(0, state.currentNode?.bonusReward ? 4 : 3);
}

function render() {
  applySettings();
  if (state.screen === 'menu') {
    renderMainMenu();
    return;
  }
  const intent = currentIntent(state);
  app.innerHTML = `
    <section class="game-hud">
      <div class="brand-lockup"><strong>Astral Gambit</strong><span>${runStepLabel()} · Turn ${state.turn}</span></div>
      <div class="controls compact">
        <button class="secondary" data-action="back-menu">Menu</button>
        <button class="secondary" data-action="toggle-tutorial" aria-expanded="${state.tutorialOpen}">Help</button>
        <button class="secondary" data-action="toggle-settings" aria-expanded="${state.settingsOpen}">Settings</button>
        <button data-action="restart">Restart</button>
      </div>
    </section>

    ${settingsTemplate()}
    ${tutorialTemplate()}
    ${creditsTemplate()}

    <main class="play-layout">
      <section class="battlefield">
        ${combatantTemplate('Player', state.player.hp, state.player.maxHp, state.player.block, `${state.player.energy}/${state.player.maxEnergy} spark`, 'player-card', 'hero-mage', playerStatusTemplate())}
        <div class="turn-panel">
          <p class="eyebrow">Plan your turn</p>
          <h2>${state.message}</h2>
          ${intentSummaryTemplate(intent)}
          ${gambitTemplate()}
          ${mapTemplate()}
          ${rewardTemplate()}
          ${resultActionTemplate()}
        </div>
        ${combatantTemplate(state.enemy.name, state.enemy.hp, state.enemy.maxHp, state.enemy.block, state.enemy.archetype, 'enemy-card', state.enemy.assetId, enemyStatusTemplate(), intentTemplate(intent))}
      </section>

      <aside class="side-panel" aria-label="Run information">
        <section class="quick-stats" aria-label="Combat resources">
          <div><strong>${state.player.energy}</strong><span>Spark</span></div>
          <div><strong>${state.player.block}</strong><span>Block</span></div>
          <div><strong>${state.enemy.status.marked}</strong><span>Marked</span></div>
          <div><strong>${state.enemy.status.scorch}</strong><span>Scorch</span></div>
        </section>
        <section class="zones">${zoneTemplate('Draw', state.deck.length)}${zoneTemplate('Discard', state.discard.length)}${zoneTemplate('Exhaust', state.exhaust.length)}</section>
        ${progressionTemplate()}
        ${glossaryTemplate()}
        <section class="log-panel"><h2>Latest actions</h2><ol>${state.log.slice(0, 5).map((entry) => `<li>${entry}</li>`).join('')}</ol></section>
      </aside>
    </main>

    <section class="hand-dock" aria-label="Player hand">
      <div class="hand-header"><strong>Your hand</strong><span>Press 1-5 or click a card</span></div>
      <div class="hand">${state.hand.map(cardTemplate).join('') || '<p class="empty-hand">No cards in hand.</p>'}</div>
    </section>
  `;

  app.querySelectorAll('[data-card-id]').forEach((button) => {
    button.addEventListener('click', () => playCard(button.dataset.cardId));
  });
  app.querySelector('[data-action="end-turn"]')?.addEventListener('click', endTurn);
  app.querySelector('[data-action="restart"]')?.addEventListener('click', () => {
    state = createGame();
    state.screen = 'game';
    render();
  });
  app.querySelector('[data-action="back-menu"]')?.addEventListener('click', () => {
    state.screen = 'menu';
    render();
  });
  app.querySelector('[data-action="toggle-tutorial"]')?.addEventListener('click', () => {
    state.tutorialOpen = !state.tutorialOpen;
    render();
  });
  app.querySelector('[data-action="toggle-credits"]')?.addEventListener('click', () => {
    state.creditsOpen = !state.creditsOpen;
    render();
  });
  app.querySelector('[data-action="toggle-settings"]')?.addEventListener('click', () => {
    state.settingsOpen = !state.settingsOpen;
    render();
  });
  app.querySelector('[data-action="toggle-fullscreen"]')?.addEventListener('click', toggleFullscreen);
  app.querySelectorAll('[data-setting]').forEach((input) => {
    input.addEventListener('input', () => updateSetting(input.dataset.setting, Number(input.value)));
  });
  app.querySelector('[data-action="open-map"]')?.addEventListener('click', openMap);
  app.querySelectorAll('[data-node-id]').forEach((button) => {
    button.addEventListener('click', () => chooseMapNode(button.dataset.nodeId));
  });
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

function loadSettings() {
  const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || 'null');
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

function saveSettings() {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state.settings));
}

function updateSetting(key, value) {
  state.settings[key] = value;
  saveSettings();
  applySettings();
}

function applySettings() {
  document.documentElement.style.setProperty('--motion-scale', state.settings.animationSpeed);
  document.documentElement.style.setProperty('--text-scale', state.settings.textScale);
  document.body.classList.toggle('large-text', state.settings.textScale > 1);
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
}

function handleKeyboardShortcuts(event) {
  if (event.target instanceof HTMLInputElement) return;
  if (state.screen === 'menu') {
    if (event.key === 'Enter') {
      startRun();
    }
    return;
  }
  if (event.key >= '1' && event.key <= '5') {
    playHandIndex(Number(event.key) - 1);
  } else if (event.code === 'Space') {
    event.preventDefault();
    endTurn();
  } else if (event.key.toLowerCase() === 'm') {
    openMap();
  } else if (event.key.toLowerCase() === 'd') {
    drawCards(state, 1);
    state.message = 'Debug draw added a card to your hand.';
    render();
  } else if (event.key.toLowerCase() === 's') {
    state.player.energy += 1;
    state.message = 'Debug tool added 1 spark.';
    render();
  }
}

function renderMainMenu() {
  app.innerHTML = `
    <main class="main-menu" aria-label="Main menu">
      <section class="menu-card">
        <p class="eyebrow">Release Candidate</p>
        <h1>Astral Gambit</h1>
        <p class="subtitle">A short, readable card-battler run built around marked burst turns, defensive timing, and delayed gambits.</p>
        <div class="menu-actions">
          <button class="end-turn" data-action="start-run">Start Run</button>
          <button class="secondary menu-button" data-action="menu-tutorial">How to Play</button>
          <button class="secondary menu-button" data-action="menu-credits">Credits</button>
        </div>
      </section>
      <section class="onboarding-panel">
        <div>
          <p class="eyebrow">Quick Tutorial</p>
          <ol>${TUTORIAL_STEPS.map((step) => `<li>${step}</li>`).join('')}</ol>
        </div>
        <div>
          <p class="eyebrow">Release Notes</p>
          <ul>${RELEASE_CHECKLIST.map((item) => `<li>${item}</li>`).join('')}</ul>
        </div>
      </section>
    </main>
  `;
  app.querySelector('[data-action="start-run"]')?.addEventListener('click', startRun);
  app.querySelector('[data-action="menu-tutorial"]')?.addEventListener('click', () => {
    state.screen = 'game';
    state.tutorialOpen = true;
    render();
  });
  app.querySelector('[data-action="menu-credits"]')?.addEventListener('click', () => {
    state.screen = 'game';
    state.creditsOpen = true;
    render();
  });
}

function startRun() {
  state = createGame();
  state.screen = 'game';
  render();
}

function settingsTemplate() {
  if (!state.settingsOpen) return '';
  return `
    <section class="settings-panel" aria-label="Settings">
      <div>
        <p class="eyebrow">Comfort settings</p>
        <h2>Fast PC-friendly adjustments</h2>
      </div>
      <label>Animation speed
        <input type="range" min="0.5" max="1.5" step="0.25" value="${state.settings.animationSpeed}" data-setting="animationSpeed">
        <strong>${state.settings.animationSpeed}x</strong>
      </label>
      <label>Text readability
        <input type="range" min="1" max="1.2" step="0.1" value="${state.settings.textScale}" data-setting="textScale">
        <strong>${Math.round(state.settings.textScale * 100)}%</strong>
      </label>
      <label>Volume
        <input type="range" min="0" max="100" step="5" value="${state.settings.volume}" data-setting="volume">
        <strong>${state.settings.volume}%</strong>
      </label>
      <button class="end-turn" data-action="toggle-fullscreen">Toggle Fullscreen</button>
    </section>
  `;
}

function tutorialTemplate() {
  if (!state.tutorialOpen) return '';
  return `
    <section class="onboarding-panel" aria-label="Tutorial">
      <div>
        <p class="eyebrow">How to play</p>
        <h2>Three-step onboarding</h2>
      </div>
      <ol>${TUTORIAL_STEPS.map((step) => `<li>${step}</li>`).join('')}</ol>
    </section>
  `;
}

function creditsTemplate() {
  if (!state.creditsOpen) return '';
  return `
    <section class="credits-panel" aria-label="Credits">
      <div>
        <p class="eyebrow">Credits</p>
        <h2>Prototype team</h2>
      </div>
      <p>Design, code, and presentation pass by the Astral Gambit prototype team. Built with Vite and vanilla JavaScript.</p>
    </section>
  `;
}

function releaseNotesTemplate() {
  return `
    <section class="release-panel" aria-label="Release checklist and known issues">
      <div>
        <p class="eyebrow">Release candidate</p>
        <h2>Checklist + known issues</h2>
      </div>
      <div>
        <strong>Checklist</strong>
        <ul>${RELEASE_CHECKLIST.map((item) => `<li>${item}</li>`).join('')}</ul>
      </div>
      <div>
        <strong>Known issues</strong>
        <ul>${KNOWN_ISSUES.map((item) => `<li>${item}</li>`).join('')}</ul>
      </div>
    </section>
  `;
}

function openMap() {
  if (state.result !== 'victory' || state.rewardOptions.length > 0 || state.mapStep >= RUN_MAP.length - 1) return;
  state.mapStep += 1;
  state.phase = 'map';
  state.result = null;
  state.message = 'Choose your next route node.';
  render();
}

function chooseMapNode(nodeId) {
  if (state.phase !== 'map') return;
  const node = RUN_MAP[state.mapStep].find((candidate) => candidate.id === nodeId);
  if (!node) return;
  state.currentNode = node;
  state.routeHistory.push(node);

  if (node.type === 'rest') {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 16);
    addLog(state, 'Rest site restores 16 HP.');
    advanceAfterUtilityNode('Rest complete. Continue to the boss route.');
    return;
  }

  if (node.type === 'upgrade') {
    state.player.maxEnergy += 1;
    state.player.energy = state.player.maxEnergy;
    addLog(state, 'Upgrade shrine grants +1 max spark.');
    advanceAfterUtilityNode('Upgrade complete. Continue to the boss route.');
    return;
  }

  if (node.type === 'event') {
    const reward = shuffle(REWARD_CARDS)[0];
    state.discard.push(createCardInstance(reward));
    state.rewardsClaimed.push(reward);
    addLog(state, `Comet Cache grants ${reward.name}.`);
    advanceAfterUtilityNode('Event complete. Continue to the boss route.');
    return;
  }

  startCombatNode(node);
}

function advanceAfterUtilityNode(message) {
  state.mapStep += 1;
  state.phase = 'map';
  state.result = null;
  state.rewardOptions = [];
  state.message = message;
  render();
}

function startCombatNode(node) {
  state.enemy = createEnemy(ENCOUNTER_BY_ID[node.encounterId]);
  state.phase = 'player';
  state.result = null;
  state.rewardOptions = [];
  state.turn = 1;
  state.player.block = 0;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + (node.type === 'elite' ? 8 : 12));
  state.player.energy = state.player.maxEnergy;
  state.player.status.marked = 0;
  state.gambits = [];
  state.discard.push(...state.hand.splice(0));
  state.discard.push(...state.deck.splice(0));
  state.deck = shuffle(state.discard.splice(0));
  drawCards(state, 5);
  state.message = state.enemy.intro;
  addLog(state, `${state.enemy.name} appears. ${state.enemy.mechanics}`);
  addLog(state, `${node.label} chosen: ${node.detail}`);
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

function runStepLabel() {
  const total = RUN_MAP.length;
  if (state.phase === 'map') return `Map ${state.mapStep + 1}/${total}`;
  return `Node ${state.mapStep + 1}/${total} · ${state.currentNode.label}`;
}

function intentTemplate(intent) {
  if (state.phase === 'map') return '<p class="gambit-empty">Pick a node to reveal the next enemy intent.</p>';
  return `
    <div class="intent-card" data-intent-kind="${intentKind(intent)}" aria-label="Enemy intent">
      <span class="intent-icon" aria-hidden="true">${intentIcon(intent)}</span>
      <span class="intent-label">Intent</span>
      <strong>${intent.intent}</strong>
    </div>
  `;
}

function intentSummaryTemplate(intent) {
  if (state.phase === 'map') return '';
  return `<p class="intent-summary"><span>${intentIcon(intent)}</span> Next enemy action: <strong>${intent.intent}</strong></p>`;
}


function mapTemplate() {
  if (state.phase !== 'map') return routeTemplate();
  const choices = RUN_MAP[state.mapStep];
  return `
    <div class="map-panel" aria-label="Run map choices">
      <p class="eyebrow">Choose next node</p>
      <div class="map-grid">
        ${choices.map(mapNodeTemplate).join('')}
      </div>
    </div>
  `;
}

function routeTemplate() {
  return `
    <div class="route-chip">
      ${state.routeHistory.map((node) => `<span>${nodeIcon(node.type)} ${node.label}</span>`).join('')}
    </div>
  `;
}

function mapNodeTemplate(node) {
  return `
    <button class="map-node" data-node-id="${node.id}" data-node-type="${node.type}">
      <span>${nodeIcon(node.type)}</span>
      <strong>${node.label}</strong>
      <small>${node.detail}</small>
    </button>
  `;
}

function nodeIcon(type) {
  const icons = { combat: '⚔', elite: '✹', rest: '☾', upgrade: '◆', event: '✦', boss: '☀' };
  return icons[type] ?? '✦';
}

function progressionTemplate() {
  const claimed = state.rewardsClaimed.map((card) => card.name).join(' · ') || 'No rewards claimed yet';
  const archetypes = archetypeSummary(state.rewardsClaimed);
  return `
    <div class="progression-chip">
      <span>Run rewards: ${claimed}</span>
      <span>Archetypes: ${archetypes}</span>
    </div>
  `;
}

function archetypeSummary(cards) {
  if (cards.length === 0) return 'Choose rewards to define your strategy';
  const counts = cards.reduce((summary, card) => {
    summary[card.archetype] = (summary[card.archetype] ?? 0) + 1;
    return summary;
  }, {});
  return Object.entries(counts)
    .map(([archetype, count]) => `${archetype} ${count}`)
    .join(' · ');
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
        <span class="type">${card.rarity} ${card.type}</span>
      </span>
      <span class="archetype">${card.archetype}</span>
      <strong>${card.name}</strong>
      <p>${card.text}</p>
      <small>${card.rewardText}</small>
    </button>
  `;
}

function resultActionTemplate() {
  if (state.result === 'victory' && state.mapStep < RUN_MAP.length - 1) {
    const disabled = state.rewardOptions.length > 0 ? 'disabled' : '';
    return `<button class="end-turn" data-action="open-map" ${disabled}>Open Map</button>`;
  }
  return `<button class="end-turn" data-action="end-turn" ${state.result || state.phase === 'map' ? 'disabled' : ''}>End Turn</button>`;
}


function combatantTemplate(name, hp, maxHp, block, detail, className, portrait, statusMarkup = '', intentMarkup = '') {
  const hpPercent = Math.max(0, (hp / maxHp) * 100);
  return `
    <article class="combatant ${className}">
      ${intentMarkup ? `<div class="enemy-intent-bubble">${intentMarkup}</div>` : ''}
      <div class="combatant-header">
        <h2>${name}</h2>
        <span class="portrait" aria-hidden="true"><svg><use href="${astralAssetsUrl}#${portrait}"></use></svg></span>
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
  const preview = card.type === 'Attack' ? attackPreview(card) : '';
  return `
    <button class="card" data-card-id="${card.instanceId}" data-type="${card.type}" title="${cardTooltip(card)}" ${disabled ? 'disabled' : ''}>
      <span class="card-topline">
        <span class="cost">${card.cost}</span>
        <span class="type">${card.type}</span>
      </span>
      <span class="card-art" aria-hidden="true">${cardGlyph(card.type)}</span>
      <span class="archetype">${card.archetype}</span>
      <strong>${card.name}</strong>
      ${preview}
      <p>${card.text}</p>
    </button>
  `;
}

function attackPreview(card) {
  const match = card.text.match(/Deal (\d+) damage/);
  if (!match) return '';
  const baseDamage = Number(match[1]);
  const markedBonus = state.enemy.status.marked > 0 ? 4 : 0;
  const blocked = Math.min(state.enemy.block, baseDamage + markedBonus);
  const damage = baseDamage + markedBonus - blocked;
  return `<span class="preview-chip">Preview: ${damage} HP damage${markedBonus ? ' after Marked' : ''}</span>`;
}

function cardTooltip(card) {
  return `${card.name}: ${card.text} Cost: ${card.cost} spark. Press number keys 1-5 to play cards from left to right.`;
}


function intentIcon(intent) {
  if (intent.damage && intent.block) return '⚔◆';
  if (intent.damage) return '⚔';
  if (intent.block) return '◆';
  if (intent.strength) return '▲';
  if (intent.summons) return '✺';
  return '✦';
}

function intentKind(intent) {
  if (intent.damage) return 'attack';
  if (intent.block) return 'defend';
  if (intent.strength || intent.summons) return 'buff';
  return 'special';
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
  return `<div class="status-list">${activeEntries.map(([label, value]) => `<span data-status="${label.toLowerCase()}" title="${statusTooltip(label)}"><b>${statusIcon(label)}</b>${label} ${value}</span>`).join('')}</div>`;
}

function statusIcon(label) {
  const icons = { Marked: '◎', Scorch: '🔥', Strength: '▲', Wisps: '✺' };
  return icons[label] ?? '✦';
}

function statusTooltip(label) {
  const tooltips = {
    Marked: 'Consumed by the next attack for bonus damage.',
    Scorch: 'Damages the enemy at the start of your turn.',
    Strength: 'Adds damage to enemy attacks.',
    Wisps: 'Enemy helpers that add chip damage to some Oracle attacks.',
  };
  return tooltips[label] ?? 'Temporary combat effect.';
}

function balanceNotesTemplate() {
  return `
    <section class="balance-panel" aria-label="Balance playtest notes">
      <div>
        <p class="eyebrow">Balance pass</p>
        <h2>Current playtest targets</h2>
      </div>
      <ul>${BALANCE_NOTES.map((note) => `<li>${note}</li>`).join('')}</ul>
    </section>
  `;
}

function glossaryTemplate() {
  return `
    <section class="glossary-panel" aria-label="Combat glossary">
      <h2>Quick Glossary</h2>
      <div>
        <span title="Your card-playing resource for the turn.">Spark</span>
        <span title="Prevents attack damage, then clears at the start of your next turn.">Block</span>
        <span title="Consumed by the next attack for +4 damage against enemies, or +3 damage against you.">Marked</span>
        <span title="Damages the enemy at the start of your turn.">Scorch</span>
        <span title="Delayed plays that resolve at the start of your next turn.">Gambit</span>
      </div>
    </section>
  `;
}
