// Leonida Night — gta6-trophy-guide-01 round 3 entrypoint (Node 22, stdlib only).
//
// The guide itself is app/ (plain static files: index.html, style.css, app.js,
// data/trophies.json, data/sources.json, data/roadmap.json), served with app/ at
// the server root, fully offline. screenshots/ holds the 4 screenshots Phase B
// takes of the running app. This program hands both in: it copies app/ and
// screenshots/ to the output directory, writes out/summary.json (the entry's
// data, counted from the data files — 7 sources with coverage counts, 174
// numbered steps, 7 stages with hours, uncertainty 49 confirmed / 6
// unconfirmed / 4 disputed) and writes /output/dossier.json with the kit's
// vendored library (vendor/makefun-frontend.ts, unchanged — the scorer
// rebuilds the dossier with its own copy and compares byte for byte).
// summary.json is canonical JSON with no timestamps, so running this program
// twice writes the same bytes twice.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Run it twice and compare: both runs must write the same bytes.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier, canonicalJson } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

interface TrophyStep {
  n: number;
  text: string;
  sources: string[];
}

interface Trophy {
  id: number;
  grade: string;
  confirm_status: string;
  disagree: boolean;
  steps: TrophyStep[];
}

interface TrophiesFile {
  points: Record<string, number>;
  trophies: Trophy[];
}

interface SourceEntry {
  key: string;
  name: string;
  coverage_count: number;
  trophies: number[];
  read: string;
}

interface SourcesFile {
  sources: SourceEntry[];
  agreement: { confirmed: number; unconfirmed: number; disagree: number };
}

interface RoadmapStage {
  id: number;
  name: string;
  hours: number;
  difficulty: string;
  trophies: number[];
}

interface RoadmapFile {
  stages: RoadmapStage[];
  overall: { total_hours: number; total_trophies: number };
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

const trophiesFile = readJson<TrophiesFile>(join(here, 'app', 'data', 'trophies.json'));
const sourcesFile = readJson<SourcesFile>(join(here, 'app', 'data', 'sources.json'));
const roadmapFile = readJson<RoadmapFile>(join(here, 'app', 'data', 'roadmap.json'));

// Count every figure from the data files — nothing here is a hardcoded claim.
const stepsTotal = trophiesFile.trophies.reduce((sum, t) => sum + t.steps.length, 0);
let confirmed = 0;
let unconfirmed = 0;
let disagree = 0;
for (const t of trophiesFile.trophies) {
  if (t.confirm_status === 'confirmed') confirmed++;
  else unconfirmed++;
  if (t.disagree) disagree++;
}
const pointsTotal = trophiesFile.trophies.reduce(
  (sum, t) => sum + (trophiesFile.points[t.grade] ?? 0),
  0,
);
const stageHours = roadmapFile.stages.reduce((sum, s) => sum + s.hours, 0);

const summary = {
  competition: 'gta6-trophy-guide-01',
  entry: 'Leonida Night — GTA 6 Trophy Guide & Tracker',
  trophies: trophiesFile.trophies.length,
  points_total: pointsTotal,
  sources: sourcesFile.sources.map((s) => ({
    key: s.key,
    name: s.name,
    coverage_count: s.trophies.length,
    read: s.read,
  })),
  steps_total: stepsTotal,
  stages: roadmapFile.stages.map((s) => ({
    id: s.id,
    name: s.name,
    hours: s.hours,
    difficulty: s.difficulty,
    trophies: s.trophies.length,
  })),
  total_hours: stageHours,
  uncertainty: { confirmed, unconfirmed, disagree },
};

// The round-3 data, asserted: fail loudly rather than hand in a wrong count.
function check(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`main.ts: ${msg}`);
}
check(summary.trophies === 55, `expected 55 trophies, counted ${summary.trophies}`);
check(summary.sources.length === 7, `expected 7 sources, counted ${summary.sources.length}`);
check(summary.steps_total === 174, `expected 174 steps, counted ${summary.steps_total}`);
check(summary.stages.length === 7, `expected 7 stages, counted ${summary.stages.length}`);
check(summary.total_hours === 200, `expected 200 stage hours, counted ${summary.total_hours}`);
check(roadmapFile.overall.total_hours === 200, `expected roadmap overall 200 hours, got ${roadmapFile.overall.total_hours}`);
check(roadmapFile.overall.total_trophies === 55, `expected roadmap overall 55 trophies, got ${roadmapFile.overall.total_trophies}`);
check(pointsTotal === 1230, `expected 1230 PSN points, counted ${pointsTotal}`);
check(
  confirmed === 49 && unconfirmed === 6 && disagree === 4,
  `expected uncertainty 49 confirmed / 6 unconfirmed / 4 disputed, counted ${confirmed}/${unconfirmed}/${disagree}`,
);
check(
  sourcesFile.agreement.confirmed === confirmed &&
    sourcesFile.agreement.unconfirmed === unconfirmed &&
    sourcesFile.agreement.disagree === disagree,
  'sources.json agreement does not match the per-trophy confirmation counts',
);
for (const s of sourcesFile.sources) {
  check(
    s.coverage_count === s.trophies.length,
    `source ${s.key}: coverage_count ${s.coverage_count} does not match its ${s.trophies.length} listed trophies`,
  );
}
// Every trophy in exactly one roadmap stage.
const staged = new Set<number>();
for (const s of roadmapFile.stages) {
  for (const id of s.trophies) {
    check(!staged.has(id), `trophy ${id} is in two roadmap stages`);
    staged.add(id);
  }
}
check(staged.size === 55, `roadmap stages cover ${staged.size} trophies, expected 55`);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}
writeFileSync(join(out, 'summary.json'), `${canonicalJson(summary)}\n`);

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest refuse
// an entry the scorer would refuse (more than 4 screenshots or one over
// 256 KiB; more than 993 files and directories in app/ or 48 MiB of app files).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
