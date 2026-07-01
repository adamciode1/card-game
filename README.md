# Astral Gambit Prototype

A small browser-based card game prototype currently focused on Session 10 of the development plan. The build keeps the playable mini-run intact while adding release-candidate presentation: a main menu, lightweight onboarding, credits, and a share-ready checklist with known issues.

## Run locally

```bash
npm install
npm start
```

Open the local Vite URL shown in the terminal, then choose **Start Run** from the main menu.

## Prototype controls

- Click cards in your hand to play them.
- Press number keys **1-5** to play cards from left to right.
- Press **Space** to end turn, **M** to open the map after claiming rewards, **D** to debug draw, and **S** to add spark.
- Click **End Turn** to discard your hand and let the enemy act.
- After a victory, choose a card reward, click **Open Map**, then pick the next route node.
- Use the **Tutorial**, **Credits**, and **Settings** controls for onboarding, attribution, fullscreen, animation speed, text readability, and volume preference.
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

## Current presentation and release candidate

- The prototype now opens on a main menu with Start Run, How to Play, and Credits actions.
- A compact tutorial explains spark, enemy intent, rewards, and route flow without adding a separate campaign layer.
- The in-game release panel lists the release checklist and known issues for external feedback builds.
- Known issues for this candidate: audio is represented by a saved volume preference only, and balance still needs external player feedback.

## Current balance and playtesting

- A lightweight `BALANCE_LOG.md` records balance targets, playtest observations, and the next repeated-run checklist.
- The in-game balance panel keeps target outcomes visible while testing the current route.
- Session 10 preserves the Session 9 balance scope and avoids adding new combat keywords, encounters, or large systems before external feedback.

## Current polish, accessibility, and usability

- Settings are intentionally small and run-focused: fullscreen toggle, animation speed, text readability scale, and a saved volume preference.
- Keyboard shortcuts support quick mouse-and-keyboard PC play without changing the core rules.
- Attack cards show a simple HP damage preview that accounts for enemy block and marked bonus.
- Card, status, and glossary tooltips explain the core terms directly in the interface.
- A shortcut strip, quick glossary, and compact tutorial keep new-player guidance visible without expanding the ruleset.

## Current mini-run route

1. **Opening Fight: Ember Wolf** — attacker/disruptor that marks the player before heavy bites.
2. **Route branch** — choose **Safe Fight: Aegis Moth** for a steadier battle or **Elite Fight: Hollow Oracle** for a harder fight with an extra reward option.
3. **Utility branch** — choose **Rest Site**, **Upgrade Shrine**, or **Comet Cache** to shape the boss approach.
4. **Boss: Solar Tyrant** — compact boss-pattern enemy with a readable setup, shield, and burst cycle.
