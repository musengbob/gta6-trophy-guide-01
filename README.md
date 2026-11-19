[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/musengbob/gta6-trophy-guide-01/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/musengbob/gta6-trophy-guide-01/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

# Leonida Night — GTA 6 Trophy Guide & Tracker

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built for the [make.fun gta6-trophy-guide-01 bounty](https://make.fun/c/gta6-trophy-guide-01). Dark "Leonida night" look, zero network requests, works with the network off.

## What it does

- **Tracker** — all 55 trophies with official names, descriptions and grades, checkboxes saved in localStorage, filters (All / Story / Missable / Collectibles / Activities / Online), text search, and a spoiler-safe setting that hides hidden trophies until earned.
- **Evidence audit strip** — live counts computed from the data file: 55/55 names, descriptions, guides and citations, the 1/2/6/46 grade split, 28 hidden, sources read 20 Nov 2026.
- **Source matrix** — every source used, with the date read and how many trophies cite it; every trophy's guide carries its own citation chip.
- **PSN points** — live earned/total counter (platinum 180, gold 90, silver 30, bronze 15; 1,230 total).
- **Platinum roadmap** — all 55 trophies in 6 stages in earning order, each row showing grade, chapter/mission/activity, count where PlayStation tracks one, and missable flag; per-stage earned/total counters.
- **Missable Watch** — the 1 confirmed missable (Chapter 1 balcony meditation) plus 17 chapter-gated story trophies, honestly flagged as chapter-gated, not missable.
- **Next Up planner** — suggests the next 3 trophies from current progress: missable first, then chapter-gated, then the earliest unfinished stage.
- **Export / import** — progress exports to a JSON file and imports back; a share link encodes progress in the URL (`?earned=…`). URL params also drive view, filter, spoiler and the open guide (`?view=&filter=&spoiler=&open=`).

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

Trophy names, descriptions and grades are shown as PlayStation publishes them. Hidden status comes from the Planet GTA 6 visible/hidden split (27 visible, 28 hidden), cross-checked against the official count. Every guide is written in our own words from the official descriptions and the cited sources — nothing is copied from another guide. Where guide writers have not confirmed a trigger yet, the guide says so. No Rockstar logo, official artwork, box art or game screenshots anywhere in the app.

## License

MIT — see [LICENSE](LICENSE).
