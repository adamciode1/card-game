# Astral Gambit Prototype

A small browser-based card game prototype currently focused on Session 5 of the development plan. The build keeps the earlier playable combat loop and escalating encounter sequence intact while adding post-encounter card rewards that let players shape their deck during the run.

## Run locally

```bash
npm install
npm start
```

Open the local Vite URL shown in the terminal.

## Prototype controls

- Click cards in your hand to play them.
- Click **End Turn** to discard your hand and let the enemy act.
- After a victory, choose one of three card rewards, then click **Next Encounter** to continue the current sequence.
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

## Current progression

- Non-final victories offer three card rewards. Pick one to add it to your discard pile for the rest of the run.
- Reward cards support different strategic directions: gambit payoff, sustain, tempo setup, and mark/scorch combos.
- The run panel tracks claimed rewards so deck changes are visible between encounters.

## Current encounter sequence

1. **Ember Wolf** — attacker/disruptor that marks the player before heavy bites.
2. **Aegis Moth** — defender that alternates large block turns with modest attacks and scorch cleansing.
3. **Hollow Oracle** — summoner/scaler that adds wisps and turns them into extra damage.
4. **Solar Tyrant** — compact boss-pattern enemy with a readable setup, shield, and burst cycle.
