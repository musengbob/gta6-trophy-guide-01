[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/musengbob/gta6-trophy-guide-01/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/musengbob/gta6-trophy-guide-01/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

# Leonida Atlas — GTA 6 Trophy Guide & Tracker

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI,
built for the [make.fun gta6-trophy-guide-01 competition](https://make.fun/c/gta6-trophy-guide-01).

Round 3 is a seat-defense rebuild: every guide is now a numbered, cited step list
(155 steps across 55 trophies), cross-checked against 7 real trophy guides read on
20 Nov 2026, with per-trophy uncertainty tracking (49 confirmed, 4 single-source,
2 unconfirmed, 7 where the sources disagree), a 7-stage roadmap with hours and
difficulty, a Missable Watch, a Next-up planner, and a visible backup panel.

## What it has

- **All 55 trophies** — 1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden — with the
  official names and descriptions as PlayStation publishes them, and a guide in our own
  words for each one.
- **155 numbered cited steps** — every step that states a location or method cites its
  source number(s); the Source Matrix counts coverage per source from the data.
- **7-stage roadmap** — named stages with per-stage hours (~200 h total), guidance text,
  overall difficulty 4/10, 1 playthrough, stage 7 the platinum.
- **Missable Watch** — Positive Mental Attitude is the only possibly missable trophy
  (the Chapter 1 balcony meditation); 31 chapter-gated trophies are listed by chapter.
- **Tracker** — checklist saved in localStorage, filters (story / side / activities /
  collectibles / crime / money / secret / missable / unconfirmed / hidden / earned /
  remaining), search, a spoiler setting that hides story trophies until earned,
  export / import / reset with the storage key and bytes used shown.
- **Uncertainty tracking** — per-trophy confirm status plus disagree flags with the
  conflict spelled out. Nothing is invented: unconfirmed methods say so plainly.
- **Offline** — static files under `app/`, no build step, no network requests at run time.

## Run it

```sh
node serve.ts   # serves app/ on http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # writes out/dossier.json
```

Run `main.ts` twice: the dossier must be byte-identical both times.

## Sources (read 20 Nov 2026)

PowerPyx, GTABase, OutputLag, SixShore, GTA Zone, FullSweep, Of Zen and Computing.
No text was copied from any of them — every step is written fresh from the facts, and
the Source Matrix in the app shows each source's counted coverage.
