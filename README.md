[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/musengbob/gta6-trophy-guide-01/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/musengbob/gta6-trophy-guide-01/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

Bounty page: [make.fun/bounty/gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01)

# Leonida Night — GTA 6 Trophy Guide & Tracker

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built for the [make.fun gta6-trophy-guide-01 bounty](https://make.fun/c/gta6-trophy-guide-01). Dark "Leonida night" look, zero network requests, works with the network off.

## What it does

- **Tracker** — all 55 trophies with official names, descriptions and grades, checkboxes saved in localStorage, filters (All / Story / Missable / Collectibles / Activities / Online), text search, and a spoiler-safe setting that hides hidden trophies until earned.
- **174 numbered cited steps** — every trophy carries its own numbered step-by-step unlock guide (2–5 steps each, 174 total), each step written in our own words from the official description and cited to the sources that confirm it.
- **Evidence audit strip** — live counts computed from the data file: 55/55 names, descriptions, guides and citations, the 1/2/6/46 grade split, 28 hidden, sources read 20 Nov 2026.
- **Source rail & matrix** — 7 sources read (PowerPyx, GTABase, OutputLag, SixShore, GTA Zone, FullSweep, PlanetGTA6), each with the date read and a per-source coverage count ("cited by N of 55"); every trophy's guide carries its own citation chip. The full matrix view shows the per-source, per-trophy coverage grid.
- **Uncertainty tracking** — every trophy carries a confirmation status: 49 confirmed by 4+ sources, 6 unconfirmed, 4 disputed (PowerPyx asserts a method, other guides do not). A confirmation filter (All / Confirmed only / Unconfirmed only) isolates the 6 unconfirmed trophies, and the 5 mystery triggers are called out honestly instead of guessed at.
- **PSN points** — live earned/total counter (platinum 180, gold 90, silver 30, bronze 15; 1,230 total).
- **Platinum roadmap** — all 55 trophies in 7 stages in earning order (story, exploration & collectibles, combat & crime, minigames/races/challenges, side strands & misc, cleanup & 100%, platinum), each stage with its difficulty, hours and guidance; difficulty 4/10, about 200 hours, 1 playthrough; per-stage earned/total counters.
- **Missable Watch** — the 1 confirmed missable (Chapter 1 balcony meditation) plus 17 chapter-gated story trophies, honestly flagged as chapter-gated, not missable.
- **Next Up planner** — suggests the next 3 trophies from current progress: missable first, then chapter-gated, then the earliest unfinished stage.
- **Backup pane** — visible in the main layout: export/import/reset buttons, the localStorage key (`leonida-night-earned-v1`) and the stored-bytes display, plus a share link that encodes progress in the URL (`?earned=…`). URL params also drive view, filter, confirmation and spoiler (`?view=&filter=&confirm=&spoiler=`).

## Run it

```sh
node serve.ts
```

then open http://localhost:8080. Any static server with `app/` at its root works.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored `buildDossier`.

## Sources & honesty

Trophy names, descriptions and grades are shown as PlayStation publishes them. Hidden status comes from the Planet GTA 6 visible/hidden split (27 visible, 28 hidden), cross-checked against the official count. Every guide is written in our own words from the official descriptions and the cited sources — nothing is copied from another guide. Where guide writers have not confirmed a trigger yet, the guide says so: 6 trophies are flagged unconfirmed, including the 5 mystery triggers no source confirms a method for. One count clash is flagged openly: the garage trophy text says 8 purchasable garages while PowerPyx's database lists 12. No Rockstar logo, official artwork, box art or game screenshots anywhere in the app.

## License

MIT — see [LICENSE](LICENSE).
