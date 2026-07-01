# Astral Gambit Prototype

A small browser-based card game prototype currently focused on Session 7 of the development plan. The build keeps the playable combat loop, archetype card rewards, and boss encounter intact while connecting battles through a compact mini-run map with route choices, utility nodes, and fast transitions.

## Run locally

```bash
npm install
npm start
```

Open the local Vite URL shown in the terminal.

## Prototype controls

- Click cards in your hand to play them.
- Click **End Turn** to discard your hand and let the enemy act.
- After a victory, choose a card reward, click **Open Map**, then pick the next route node.
- Use **Debug Draw** and **+1 Spark** to quickly test card draw and energy states.
- Click **Restart Run** after victory, defeat, or whenever you want a fresh sequence.

## Current mechanics

- **Spark** is your turn resource for playing cards.
- **Block** prevents incoming attack damage and clears at the start of your next turn.
- **Marked** is consumed by the next attack for bonus damage.
- **Scorch** damages the enemy at the start of your turn.
- **Strength** increases enemy attack damage.
- **Gambits** are delayed plays that arm now and resolve at the start of your next turn.
- **Wisps** are summoned enemy helpers that add chip damage to specific Hollow Oracle attacks.

## Current run structure, progression, and archetypes

- Non-final combat victories offer card rewards. Pick one to add it to your discard pile for the rest of the run.
- Reward cards now show their archetype and rarity so deckbuilding decisions are easier to compare at a glance.
- **Starblade** cards convert marked windows into burst damage and occasional draw.
- **Lunar Guard** cards emphasize block, sustain, and defensive payoffs.
- **Eclipse Gambit** cards reward planning a turn ahead with delayed spark, draw, and damage.
- **Void Hex** cards set up marked/scorch combo turns.
- **Solar Flare** cards apply scorch and include higher-risk rare finishers.
- Cross-archetype rewards such as Mirror Aegis and Solar Kindling encourage hybrid decks without adding new core rules.
- The run panel tracks claimed rewards, chosen archetypes, and the route history so deck direction remains visible between nodes.
- The mini-run map starts with an opening fight, then offers a safe combat or elite combat branch, one utility choice, and a final boss.
- Utility nodes stay lightweight: rest heals HP, upgrade grants +1 max spark, and event adds a random reward card.

## Current mini-run route

1. **Opening Fight: Ember Wolf** — attacker/disruptor that marks the player before heavy bites.
2. **Route branch** — choose **Safe Fight: Aegis Moth** for a steadier battle or **Elite Fight: Hollow Oracle** for a harder fight with an extra reward option.
3. **Utility branch** — choose **Rest Site**, **Upgrade Shrine**, or **Comet Cache** to shape the boss approach.
4. **Boss: Solar Tyrant** — compact boss-pattern enemy with a readable setup, shield, and burst cycle.
