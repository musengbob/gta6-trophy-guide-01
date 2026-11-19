[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/musengbob/gta6-trophy-guide-01/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/musengbob/gta6-trophy-guide-01/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

# Leonida Ledger — GTA 6 Trophy Guide & Tracker

An offline web app that is the best guide and tracker for the 55 PlayStation 5
trophies of Grand Theft Auto VI. Static files that open in a desktop browser and
work with the network off.

Built for the [make.fun gta6-trophy-guide-01 bounty](https://make.fun/c/gta6-trophy-guide-01).

## What it does

- Every trophy with its official name, description and grade: 1 Platinum,
  2 Gold, 6 Silver, 46 Bronze — 28 of them hidden until earned.
- A checklist saved in the browser, with export and import, filters by kind,
  and a spoiler setting that hides story trophies until they are earned.
- A guide to each trophy in our own words that cites its sources: what to do,
  where and how, and when it can be missed — restructured into numbered,
  cited steps (153 steps across the 55 guides).
- A 7-stage roadmap to the platinum: difficulty 4/10, about 200 hours,
  1 playthrough.
- Missable tracking: only Positive Mental Attitude (id 28) is flagged as
  potentially missable, with the Chapter 1 meditation called out.
- Honest uncertainty tracking: every trophy is marked confirmed, single-source
  or unconfirmed, and guides spell out where sources disagree (10 trophies).

## Sources

Every guide cites its sources. The 7 sources, read 20 November 2026, are
listed with per-source depth notes in `app/data/sources.json`:

1. PowerPyx — GTA 6 Trophy Guide & Roadmap
2. GTABase — GTA 6 Trophy Guide & Achievements List
3. OutputLag — GTA 6 Trophy List
4. SixShore — GTA 6 Trophy and Achievement List
5. GTA Zone — GTA 6 Trophy List
6. FullSweep — GTA 6 Trophy List
7. PlanetGTA6 — GTA 6 Trophies

## Data

- `app/data/trophies.json` — the 55 trophies with guides, numbered cited
  steps, confirmation status, disagreement flags, locations, counts,
  missable and chapter-gate flags, and PSN points (1,230 total).
- `app/data/sources.json` — the 7 cited sources with coverage notes.
- `app/data/roadmap.json` — the 7-stage platinum roadmap.

## Run it

Serve `app/` with any static file server and open `index.html` in a desktop
browser. It works with the network off.

## License

MIT. No Rockstar logo or official artwork is used.
