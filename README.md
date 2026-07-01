# Astral Gambit Prototype

A small browser-based card game prototype currently focused on Session 2 of the development plan. The build keeps the Session 1 playable loop intact while adding a more tactical combat rhythm: readable enemy intentions, spark management, block timing, status effects, and a distinctive delayed **gambit** mechanic.

## Run locally

```bash
npm install
npm start
```

Open the local Vite URL shown in the terminal.

## Prototype controls

- Click cards in your hand to play them.
- Click **End Turn** to discard your hand and let the enemy act.
- Use **Debug Draw** and **+1 Spark** to quickly test card draw and energy states.
- Click **Restart Encounter** after victory, defeat, or whenever you want a fresh run.

## Current mechanics

- **Spark** is your turn resource for playing cards.
- **Block** prevents incoming attack damage and clears at the start of your next turn.
- **Marked** is consumed by the next attack for bonus damage.
- **Scorch** damages the enemy at the start of your turn.
- **Strength** increases the Ember Wolf's future attack damage.
- **Gambits** are delayed plays that arm now and resolve at the start of your next turn.
