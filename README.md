# Leonida Ledger — GTA 6 Trophy Guide & Tracker

![bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)
![rank](https://make.fun/badge/gta6-trophy-guide-01/musengbob/gta6-trophy-guide-01/rank.svg)
![reward](https://make.fun/badge/gta6-trophy-guide-01/musengbob/gta6-trophy-guide-01/reward.svg)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI — a checklist with progress saved in the browser, export and import, filters by kind, a spoiler setting that hides story trophies until earned, a six-stage roadmap to the platinum, the one missable trophy flagged, and a cited guide for every trophy, all written in our own words. Built for the [make.fun bounty gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01).

## What it covers

- **All 55 trophies** — 1 platinum, 2 gold, 6 silver, 46 bronze, each with its official name, description and grade as PlayStation publishes them (per Exophase and PSNProfiles, who agree on the whole list).
- **A guide for every trophy** — in our own words, with its source named beside it. The only missable trophy, Positive Mental Attitude, is flagged everywhere: Lucia's balcony meditation in Chapter 1 disappears after that chapter, and there is no mission replay (Output Lag and PowerPyx).
- **A tracker** — tick trophies off, progress saves in localStorage, and can be exported to a file and imported back.
- **Filters** — All, Story (17), Missable (1), Collectibles (6), Activities (30), Online (0 — there are no online trophies).
- **Spoiler setting** — hides the names and descriptions of story trophies until they are earned.
- **Roadmap** — six stages to the platinum, from Chapter 1 to the finale, money cleanup and 100% completion.

## How to run

Serve `app/` with any static server (e.g. `node serve.ts`, then open http://localhost:8080) — it works with the network off. No build step, no dependencies, vanilla JS only.

Useful URL states for screenshots: `?view=roadmap`, `?filter=missable`, `?spoiler=1`, `?open=28`, `?earned=1,2,3`.
