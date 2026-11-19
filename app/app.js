// Leonida Atlas — GTA 6 trophy guide + tracker. Static, offline, no network at run time.
// Loads data/trophies.json (same folder), renders the checklist, roadmap, source matrix,
// uncertainty tracker and backup panel, and saves progress in localStorage.
'use strict';

const STORE_KEY = 'leonida-atlas-gta6-v3';
const POINTS = { platinum: 180, gold: 90, silver: 30, bronze: 15 };
const KIND_LABEL = {
  story: 'Story', side: 'Side strand', activity: 'Activity', collectible: 'Collectible',
  crime: 'Crime', money: 'Money', secret: 'Hidden one-off', completion: 'Completion',
};
const FILTERS = [
  ['all', 'All'], ['story', 'Story'], ['side', 'Side'], ['activity', 'Activities'],
  ['collectible', 'Collectibles'], ['crime', 'Crime'], ['money', 'Money'], ['secret', 'Secret'],
  ['missable', 'Missable'], ['uncertain', 'Unconfirmed'], ['hidden', 'Hidden'],
  ['earned', 'Earned'], ['remaining', 'Remaining'],
];

let DATA = null;
let earned = new Set();
let filter = 'all';
let query = '';
let spoiler = true;
let openId = null;
let soloId = null;

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.earned)) earned = new Set(parsed.earned.filter(Number.isInteger));
  } catch { /* corrupted save: start empty */ }
}
function save() {
  const payload = { app: 'leonida-atlas-gta6', version: 3, earned: [...earned].sort((a, b) => a - b) };
  localStorage.setItem(STORE_KEY, JSON.stringify(payload));
  refreshBackup();
}
function storeBytes() {
  const raw = localStorage.getItem(STORE_KEY);
  return raw ? new Blob([raw]).size : 0;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function gradeTag(t) {
  return `<span class="tag tag-${t.grade}">${t.grade}</span>`;
}
function confirmTag(t) {
  if (t.confirm === 'confirmed') return '<span class="tag tag-conf">Confirmed</span>';
  if (t.confirm === 'single') return '<span class="tag tag-single">Single-source</span>';
  return '<span class="tag tag-unc">Unconfirmed</span>';
}
function isHiddenFromSpoiler(t) {
  return spoiler && t.kind === 'story' && !earned.has(t.id);
}
function shownName(t) {
  return isHiddenFromSpoiler(t) ? 'Hidden story trophy' : t.name;
}
function shownDesc(t) {
  return isHiddenFromSpoiler(t) ? 'Story trophy — hidden until earned. Turn spoilers off to see it.' : t.description;
}
function stepSources(step) {
  return step.s.map(n => `<span class="src">[${n}]</span>`).join('');
}
function sourceNames(nums) {
  return nums.map(n => DATA.sources.find(s => s.n === n).name).join(', ');
}

function trophyMatches(t) {
  if (filter === 'missable' && !t.missable) return false;
  if (filter === 'uncertain' && t.confirm === 'confirmed') return false;
  if (filter === 'hidden' && !t.hidden) return false;
  if (filter === 'earned' && !earned.has(t.id)) return false;
  if (filter === 'remaining' && earned.has(t.id)) return false;
  if (filter !== 'all' && filter !== 'missable' && filter !== 'uncertain' && filter !== 'hidden' &&
      filter !== 'earned' && filter !== 'remaining' && t.kind !== filter) return false;
  if (query) {
    const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function renderAudit() {
  const tr = DATA.trophies;
  const totalSteps = tr.reduce((n, t) => n + t.steps.length, 0);
  const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  tr.forEach(t => { grades[t.grade]++; });
  const hidden = tr.filter(t => t.hidden).length;
  const pts = tr.reduce((n, t) => n + POINTS[t.grade], 0);
  const stats = [
    [`${tr.length}`, 'trophies'],
    [`${grades.platinum}P ${grades.gold}G ${grades.silver}S ${grades.bronze}B`, 'grade split'],
    [`${hidden}`, 'hidden'],
    [`${totalSteps}`, 'cited steps'],
    [`${DATA.sources.length}`, 'sources read'],
    [`${pts.toLocaleString('en-US')}`, 'PSN points'],
    [DATA.meta.difficulty, 'difficulty'],
    [`~${DATA.meta.hours_total} h`, 'to platinum'],
    [`${DATA.meta.playthroughs}`, 'playthrough'],
    [`${DATA.meta.online_trophies}`, 'online trophies'],
    [`${tr.filter(t => t.missable).length}`, 'possibly missable'],
    [`${DATA.stages.length}`, 'roadmap stages'],
  ];
  document.getElementById('audit').innerHTML = stats.map(([b, s]) =>
    `<div class="stat"><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join('');
}

function renderProgress() {
  const total = DATA.trophies.length;
  const done = DATA.trophies.filter(t => earned.has(t.id));
  const pts = done.reduce((n, t) => n + POINTS[t.grade], 0);
  const maxPts = DATA.trophies.reduce((n, t) => n + POINTS[t.grade], 0);
  const pct = Math.round((done.length / total) * 100);
  document.getElementById('hero-earned').textContent = `${done.length} / ${total}`;
  document.getElementById('hero-points').textContent = `${pts.toLocaleString('en-US')} / ${maxPts.toLocaleString('en-US')} PSN pts`;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-label').textContent =
    `${done.length} of ${total} trophies earned (${pct}%) — ${pts.toLocaleString('en-US')} of ${maxPts.toLocaleString('en-US')} PSN points. Progress saves automatically in this browser.`;
}

function renderMissable() {
  const m = DATA.trophies.find(t => t.missable);
  const gated = DATA.trophies.filter(t => t.chapter !== null && t.chapter >= 2 && !t.missable);
  const byChapter = {};
  gated.forEach(t => { (byChapter[t.chapter] = byChapter[t.chapter] || []).push(t); });
  const gatedHtml = Object.keys(byChapter).sort((a, b) => a - b).map(ch =>
    `<div><b>Chapter ${ch}+ (${byChapter[ch].length}):</b> ${byChapter[ch].map(t => esc(t.name)).join(' · ')}</div>`).join('');
  document.getElementById('missable-body').innerHTML = `
    <div class="miss-box">
      <span class="tag tag-miss">Possibly missable</span>
      <div>
        <p class="miss-name">${esc(m.name)} <span class="tag tag-bronze">bronze</span> <span class="tag tag-stage">Stage ${m.stage}</span></p>
        <p>${esc(m.guide)}</p>
        <p style="margin-top:6px"><a href="#guide-${m.id}" data-open="${m.id}">Open its cited steps ↓</a></p>
      </div>
    </div>
    <div class="gated"><b>${gated.length} chapter-gated trophies</b> (need a story unlock first — none is missable):</div>
    <div class="gated">${gatedHtml}</div>`;
  document.querySelector('#missable-body a[data-open]').addEventListener('click', (e) => {
    e.preventDefault();
    openTrophy(m.id);
  });
}

function nextUpList() {
  const rest = DATA.trophies.filter(t => !earned.has(t.id));
  rest.sort((a, b) => (b.missable - a.missable) || (a.stage - b.stage) || (a.id - b.id));
  return rest.slice(0, 5);
}
function renderNextUp() {
  const list = nextUpList();
  const el = document.getElementById('nextup-list');
  if (!list.length) {
    el.innerHTML = '<li>Everything is ticked — the platinum is yours. Leonida Legend!</li>';
    return;
  }
  el.innerHTML = list.map(t => {
    const why = t.missable
      ? 'Do this first — the only possibly missable trophy.'
      : `Stage ${t.stage} · ${KIND_LABEL[t.kind]} · ${t.grade} (${POINTS[t.grade]} pts)`;
    return `<li><span class="nu-name">${esc(shownName(t))}</span> <span class="nu-why">— ${esc(why)}</span>
      <a href="#guide-${t.id}" data-open="${t.id}">guide ↓</a></li>`;
  }).join('');
  el.querySelectorAll('a[data-open]').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    openTrophy(Number(a.dataset.open));
  }));
}

function renderFilters() {
  const counts = {};
  FILTERS.forEach(([key]) => {
    const saved = filter;
    filter = key;
    counts[key] = DATA.trophies.filter(trophyMatches).length;
    filter = saved;
  });
  document.getElementById('filters').innerHTML = FILTERS.map(([key, label]) =>
    `<button type="button" class="chip${key === filter ? ' on' : ''}" data-filter="${key}">${esc(label)} (${counts[key]})</button>`).join('');
  document.querySelectorAll('#filters .chip').forEach(c => c.addEventListener('click', () => {
    filter = c.dataset.filter;
    renderFilters();
    renderList();
  }));
}

function renderList() {
  const shown = soloId !== null
    ? DATA.trophies.filter(t => t.id === soloId)
    : DATA.trophies.filter(trophyMatches);
  document.getElementById('shown-count').textContent = `Showing ${shown.length} of ${DATA.trophies.length}`;
  document.getElementById('list').innerHTML = shown.map(t => {
    const isOpen = openId === t.id;
    const hiddenSpoiler = isHiddenFromSpoiler(t);
    const tags = [
      gradeTag(t),
      `<span class="tag tag-kind">${KIND_LABEL[t.kind]}</span>`,
      t.hidden ? '<span class="tag tag-hidden">Hidden</span>' : '',
      t.missable ? '<span class="tag tag-miss">Missable?</span>' : '',
      `<span class="tag tag-stage">Stage ${t.stage}</span>`,
      t.chapter ? `<span class="tag tag-kind">Ch ${t.chapter}+</span>` : '',
      confirmTag(t),
      t.disagree ? '<span class="tag tag-dis">Sources disagree</span>' : '',
    ].join('');
    let body = '';
    if (hiddenSpoiler) {
      body = `<p class="t-guide">This story trophy is hidden by the spoiler setting. Earn it in-game, or turn spoilers off above to read its guide.</p>`;
    } else {
      const srcNums = [...new Set(t.steps.flatMap(s => s.s))].sort((a, b) => a - b);
      body = `<p class="t-guide">${esc(t.guide)}</p>
        <ol class="steps">${t.steps.map(s => `<li>${esc(s.t)} ${stepSources(s)}</li>`).join('')}</ol>
        <p class="src-legend">Sources: ${esc(sourceNames(srcNums))} — see the Source Matrix below.</p>
        ${t.disagree ? `<div class="dis-note"><b>Sources disagree:</b> ${esc(t.disagree_note)}</div>` : ''}`;
    }
    return `<article class="trophy${earned.has(t.id) ? ' earned' : ''}${isOpen ? ' open' : ''}" id="t-${t.id}" data-id="${t.id}">
      <div class="t-head">
        <input type="checkbox" ${earned.has(t.id) ? 'checked' : ''} aria-label="Earned: ${esc(t.name)}">
        <div class="t-main">
          <div class="t-name">${esc(shownName(t))}</div>
          <div class="t-desc">${esc(shownDesc(t))}</div>
          <div class="t-tags">${tags}</div>
        </div>
        <div class="t-points">${POINTS[t.grade]} pts</div>
        <div class="t-chevron">›</div>
      </div>
      <div class="t-body">${body}</div>
    </article>`;
  }).join('');
  document.querySelectorAll('#list .trophy').forEach(card => {
    const id = Number(card.dataset.id);
    card.querySelector('.t-head').addEventListener('click', (e) => {
      if (e.target.matches('input[type="checkbox"]')) return;
      openId = openId === id ? null : id;
      renderList();
    });
    card.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
      if (e.target.checked) earned.add(id); else earned.delete(id);
      save();
      renderProgress();
      renderNextUp();
      renderList();
      renderRoadmap();
      renderBackup();
    });
  });
}

function openTrophy(id) {
  filter = 'all';
  query = '';
  document.getElementById('search').value = '';
  openId = id;
  renderFilters();
  renderList();
  const card = document.getElementById('t-' + id);
  if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });
}

function renderRoadmap() {
  const totalHours = DATA.stages.reduce((n, s) => n + s.hours, 0);
  document.getElementById('roadmap-note').textContent =
    `Difficulty ${DATA.meta.difficulty} · about ${totalHours} hours in total (${DATA.meta.hours_note}) · ${DATA.meta.playthroughs} playthrough · ${DATA.meta.online_trophies} online trophies. Each stage lists its trophies; tick them off in the checklist above.`;
  document.getElementById('stages').innerHTML = DATA.stages.map(s => {
    const members = DATA.trophies.filter(t => t.stage === s.n);
    const done = members.filter(t => earned.has(t.id)).length;
    return `<div class="stage${s.n === 7 ? ' plat' : ''}">
      <div class="stage-head"><h3><span class="snum">Stage ${s.n}</span> — ${esc(s.title)}</h3>
      <span class="stage-hours">${s.hours === 0 ? 'Platinum' : '~' + s.hours + ' h'}</span></div>
      <div class="stage-span">${esc(s.span)} · ${done}/${members.length} earned</div>
      <p>${esc(s.text)}</p>
      <div class="stage-trophies">${members.map(t =>
        `<span class="mini${earned.has(t.id) ? ' done' : ''}" title="${esc(t.description)}">${esc(t.name)}</span>`).join('')}</div>
    </div>`;
  }).join('');
}

function renderSources() {
  const coverage = {};
  DATA.sources.forEach(s => { coverage[s.n] = 0; });
  DATA.trophies.forEach(t => {
    const cited = new Set(t.steps.flatMap(s => s.s));
    cited.forEach(n => { coverage[n]++; });
  });
  document.querySelector('#matrix tbody').innerHTML = DATA.sources.map(s => `
    <tr><td>[${s.n}]</td><td><b>${esc(s.name)}</b></td><td>${esc(s.page)}</td>
    <td>${esc(s.read)}</td><td class="num">${coverage[s.n]} / ${DATA.trophies.length}</td>
    <td>${esc(s.depth)}</td></tr>`).join('');
  document.getElementById('method').textContent = DATA.meta.method;
}

function renderUncertainty() {
  const counts = { confirmed: 0, single: 0, unconfirmed: 0, disagree: 0 };
  DATA.trophies.forEach(t => { counts[t.confirm]++; if (t.disagree) counts.disagree++; });
  document.getElementById('unc-counts').innerHTML = [
    [`${counts.confirmed}`, 'confirmed (2+ sources agree)'],
    [`${counts.single}`, 'single-source'],
    [`${counts.unconfirmed}`, 'unconfirmed'],
    [`${counts.disagree}`, 'sources disagree'],
  ].map(([b, s]) => `<div class="stat"><b>${b}</b><span>${s}</span></div>`).join('');
  const flagged = DATA.trophies.filter(t => t.confirm !== 'confirmed' || t.disagree);
  flagged.sort((a, b) => (a.confirm === 'unconfirmed' ? 0 : a.confirm === 'single' ? 1 : 2) - (b.confirm === 'unconfirmed' ? 0 : b.confirm === 'single' ? 1 : 2) || a.id - b.id);
  document.getElementById('unc-list').innerHTML = flagged.map(t => {
    const note = t.disagree ? t.disagree_note
      : t.confirm === 'unconfirmed' ? 'No source has a verified unlock method yet. The guide states the leading belief and says so plainly — nothing is invented.'
      : 'Only one source gives a concrete method; the other guides still list this one as unconfirmed. Treat the steps as the best current lead.';
    return `<div class="unc-item"><span class="u-name">${esc(t.name)}</span> ${gradeTag(t)} ${confirmTag(t)}${t.disagree ? ' <span class="tag tag-dis">Sources disagree</span>' : ''}
      <p>${esc(note)}</p></div>`;
  }).join('');
}

function refreshBackup() {
  document.getElementById('bk-key').textContent = STORE_KEY;
  document.getElementById('bk-bytes').textContent = storeBytes().toLocaleString('en-US') + ' bytes';
  document.getElementById('bk-ticked').textContent = `${earned.size} / ${DATA.trophies.length}`;
}
function renderBackup() {
  refreshBackup();
  document.getElementById('btn-export').onclick = () => {
    const payload = { app: 'leonida-atlas-gta6', version: 3, exported: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-atlas-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
    document.getElementById('backup-status').textContent = `Exported ${earned.size} earned trophies.`;
  };
  document.getElementById('file-import').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed.earned)) throw new Error('no earned list');
        const ids = new Set(DATA.trophies.map(t => t.id));
        earned = new Set(parsed.earned.filter(n => ids.has(n)));
        save();
        renderProgress(); renderNextUp(); renderList(); renderRoadmap(); renderBackup();
        document.getElementById('backup-status').textContent = `Imported ${earned.size} earned trophies from ${file.name}.`;
      } catch {
        document.getElementById('backup-status').textContent = 'That file is not a Leonida Atlas export — nothing was imported.';
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };
  document.getElementById('btn-reset').onclick = () => {
    earned = new Set();
    save();
    renderProgress(); renderNextUp(); renderList(); renderRoadmap(); renderBackup();
    document.getElementById('backup-status').textContent = 'Progress reset. All 55 trophies are unticked.';
  };
}

function applyHash() {
  const h = location.hash.replace(/^#/, '');
  if (!h) return;
  if (h === 'spoilers-off') {
    spoiler = false;
    document.getElementById('spoiler').checked = false;
    renderList();
    return;
  }
  if (h.startsWith('guide-')) {
    const id = Number(h.slice(6));
    if (DATA.trophies.some(t => t.id === id)) {
      spoiler = false;
      document.getElementById('spoiler').checked = false;
      document.body.classList.add('shot-guide');
      soloId = id;
      openId = id;
      renderFilters();
      renderList();
    }
    return;
  }
  if (h.startsWith('filter-')) {
    const key = h.slice(7);
    if (FILTERS.some(([k]) => k === key)) {
      filter = key;
      renderFilters();
      renderList();
    }
    return;
  }
  const section = document.getElementById(h);
  if (section && (h === 'roadmap' || h === 'sources')) {
    document.body.classList.add('shot-' + h);
    window.scrollTo(0, 0);
    return;
  }
  if (section) setTimeout(() => section.scrollIntoView({ behavior: 'instant', block: 'start' }), 50);
}

async function init() {
  const res = await fetch('data/trophies.json');
  DATA = await res.json();
  loadSaved();
  document.getElementById('spoiler').addEventListener('change', (e) => {
    spoiler = e.target.checked;
    renderList();
    renderNextUp();
  });
  document.getElementById('search').addEventListener('input', (e) => {
    query = e.target.value.trim().toLowerCase();
    renderList();
  });
  renderAudit();
  renderProgress();
  renderMissable();
  renderNextUp();
  renderFilters();
  renderList();
  renderRoadmap();
  renderSources();
  renderUncertainty();
  renderBackup();
  applyHash();
}

init();
