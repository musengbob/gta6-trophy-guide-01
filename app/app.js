/* Leonida Night — GTA 6 trophy guide & tracker.
   Vanilla JS, no libraries, no network at run time beyond loading this app's
   own files. Data lives in data/trophies.json; progress lives in localStorage. */
(function () {
  'use strict';

  var EARNED_KEY = 'leonida-night-earned-v1';
  var SPOILER_KEY = 'leonida-night-spoiler-v1';

  var data = null; // { trophies, sources, stages, points, sourcesRead }
  var state = {
    view: 'tracker',
    filter: 'all',
    spoiler: false,
    query: '',
    openIds: {},
    earned: {}
  };

  function $(id) { return document.getElementById(id); }
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- data + state ---------- */

  function loadData() {
    return fetch('data/trophies.json').then(function (r) {
      if (!r.ok) throw new Error('trophies.json failed to load');
      return r.json();
    });
  }

  function loadProgress() {
    try {
      var saved = JSON.parse(localStorage.getItem(EARNED_KEY) || '[]');
      saved.forEach(function (id) { state.earned[id] = true; });
    } catch (e) { /* corrupted save: start empty */ }
    try {
      state.spoiler = localStorage.getItem(SPOILER_KEY) === 'on';
    } catch (e) { /* no storage */ }
  }

  function saveProgress() {
    try {
      localStorage.setItem(EARNED_KEY, JSON.stringify(earnedIds()));
      localStorage.setItem(SPOILER_KEY, state.spoiler ? 'on' : 'off');
    } catch (e) { /* storage unavailable: progress lives only in memory */ }
  }

  function earnedIds() {
    return Object.keys(state.earned).map(Number).sort(function (a, b) { return a - b; });
  }

  function isEarned(id) { return !!state.earned[id]; }

  function isMasked(t) {
    return state.spoiler && t.hidden && !isEarned(t.id);
  }

  function parseUrlParams() {
    var p = new URLSearchParams(window.location.search);
    var view = p.get('view');
    if (view === 'tracker' || view === 'roadmap' || view === 'missable' || view === 'sources') state.view = view;
    var filter = p.get('filter');
    if (filter === 'all' || filter === 'story' || filter === 'missable' || filter === 'collectibles' || filter === 'activities' || filter === 'online') state.filter = filter;
    var spoiler = p.get('spoiler');
    if (spoiler === 'on') state.spoiler = true;
    if (spoiler === 'off') state.spoiler = false;
    var open = p.get('open');
    if (open && !isNaN(parseInt(open, 10))) state.openIds[parseInt(open, 10)] = true;
    var earned = p.get('earned');
    if (earned) {
      state.earned = {};
      earned.split(',').forEach(function (s) {
        var id = parseInt(s, 10);
        if (id >= 1 && id <= 55) state.earned[id] = true;
      });
      saveProgress();
    }
  }

  function syncUrl() {
    var p = new URLSearchParams();
    if (state.view !== 'tracker') p.set('view', state.view);
    if (state.filter !== 'all') p.set('filter', state.filter);
    if (state.spoiler) p.set('spoiler', 'on');
    var ids = earnedIds();
    if (ids.length) p.set('earned', ids.join(','));
    var q = p.toString();
    history.replaceState(null, '', window.location.pathname + (q ? '?' + q : ''));
  }

  /* ---------- computed facts (all counted from the data file) ---------- */

  function gradeCount(grade) {
    return data.trophies.filter(function (t) { return t.grade === grade; }).length;
  }

  function totalPoints() {
    return data.trophies.reduce(function (sum, t) { return sum + data.points[t.grade]; }, 0);
  }

  function earnedPoints() {
    return data.trophies.reduce(function (sum, t) {
      return sum + (isEarned(t.id) ? data.points[t.grade] : 0);
    }, 0);
  }

  function stageCount(stageId) {
    var list = data.trophies.filter(function (t) { return t.stage === stageId; });
    var done = list.filter(function (t) { return isEarned(t.id); }).length;
    return { done: done, total: list.length };
  }

  function sourceCitationCount(key) {
    return data.trophies.filter(function (t) { return t.sources.indexOf(key) !== -1; }).length;
  }

  function computeAudit() {
    var n = data.trophies.length;
    var names = data.trophies.filter(function (t) { return t.name && t.name.trim(); }).length;
    var descs = data.trophies.filter(function (t) { return t.description && t.description.trim(); }).length;
    var guides = data.trophies.filter(function (t) { return t.guide && t.guide.trim(); }).length;
    var cited = data.trophies.filter(function (t) { return t.sources && t.sources.length; }).length;
    var hidden = data.trophies.filter(function (t) { return t.hidden; }).length;
    return '✓ ' + names + '/' + n + ' official names · ' + descs + '/' + n + ' descriptions · ' +
      guides + '/' + n + ' guides · ' + cited + '/' + n + ' cited · ' +
      gradeCount('platinum') + ' platinum · ' + gradeCount('gold') + ' gold · ' +
      gradeCount('silver') + ' silver · ' + gradeCount('bronze') + ' bronze · ' +
      hidden + ' hidden · Sources read ' + data.sourcesRead;
  }

  /* ---------- planner ---------- */

  function nextUpList() {
    var todo = data.trophies.filter(function (t) { return !isEarned(t.id); });
    function priority(t) {
      if (t.missable) return 0;
      if (t.chapterGated) return 1;
      return 2;
    }
    todo.sort(function (a, b) {
      var pa = priority(a), pb = priority(b);
      if (pa !== pb) return pa - pb;
      if (a.stage !== b.stage) return a.stage - b.stage;
      return a.id - b.id;
    });
    return todo.slice(0, 3).map(function (t) {
      var why;
      if (t.missable) why = 'MISSABLE — do it before Chapter 1 ends';
      else if (t.chapterGated) why = 'Chapter-gated — earn it before advancing';
      else why = 'Stage ' + t.stage + ' — next in the roadmap';
      return { trophy: t, why: why };
    });
  }

  /* ---------- rendering ---------- */

  function renderAudit() {
    $('audit-text').textContent = computeAudit();
  }

  function renderHeaderStats() {
    var ids = earnedIds();
    $('points-value').textContent = earnedPoints() + ' / ' + totalPoints().toLocaleString('en-US');
    $('progress-value').textContent = ids.length + ' / ' + data.trophies.length;
    $('progress-fill').style.width = (ids.length / data.trophies.length * 100) + '%';
  }

  function renderNextUp() {
    var list = nextUpList();
    var el = $('nextup-list');
    if (!list.length) {
      el.innerHTML = '<li>All 55 earned — the platinum is yours. Leonida Legend.</li>';
      return;
    }
    el.innerHTML = list.map(function (item) {
      var t = item.trophy;
      var name = isMasked(t) ? 'Hidden trophy (Stage ' + t.stage + ')' : escapeHtml(t.name);
      return '<li><b>' + name + '</b> <span class="why">— ' + escapeHtml(item.why) + ' · ' + escapeHtml(t.where) + '</span></li>';
    }).join('');
  }

  function renderStageStrip() {
    $('stage-strip').innerHTML = data.stages.map(function (s) {
      var c = stageCount(s.id);
      var done = c.done === c.total ? ' done' : '';
      return '<button class="stage-chip' + done + '" type="button" data-stage="' + s.id + '">' +
        'Stage ' + s.id + ': <b>' + c.done + '/' + c.total + '</b> · ' + escapeHtml(s.name) + '</button>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('.stage-chip'), function (btn) {
      btn.addEventListener('click', function () { setView('roadmap'); });
    });
  }

  function citationHtml(t) {
    var names = t.sources.map(function (key) { return data.sources[key].name; });
    return '<div class="cite">Source: <b>' + escapeHtml(names.join('; ')) + '</b> · read ' + escapeHtml(data.sourcesRead) + '</div>';
  }

  function trophyCard(t) {
    var masked = isMasked(t);
    var earned = isEarned(t.id);
    var open = !!state.openIds[t.id];
    var name = masked ? '<span class="masked">Hidden trophy — earn to reveal</span>' : escapeHtml(t.name);
    var desc = masked ? 'Hidden on PlayStation until earned.' : escapeHtml(t.description);
    var chips = '<span class="chip">' + escapeHtml(t.where) + '</span>';
    if (t.count !== null && t.count !== undefined) chips += '<span class="chip">Count: ' + escapeHtml(String(t.count)) + '</span>';
    chips += '<span class="chip">Stage ' + t.stage + '</span>';
    if (t.missable) chips += '<span class="chip missable">MISSABLE</span>';
    if (t.chapterGated) chips += '<span class="chip gated">CHAPTER-GATED</span>';
    if (t.hidden) chips += '<span class="chip hidden-tag">HIDDEN ON PSN</span>';
    var guideBlock = '';
    if (open && !masked) {
      guideBlock = '<p class="guide">' + escapeHtml(t.guide) + '</p>' + citationHtml(t);
    } else if (open && masked) {
      guideBlock = '<p class="guide">Guide hidden until this trophy is earned — spoiler-safe mode is on.</p>';
    }
    return '<article class="card grade-' + t.grade + (earned ? ' earned' : '') + '" data-id="' + t.id + '">' +
      '<div class="card-head">' +
      '<input class="card-check" type="checkbox" data-check="' + t.id + '"' + (earned ? ' checked' : '') + ' aria-label="Mark earned">' +
      '<h3 class="card-name">' + name + '<span class="grade-badge">' + t.grade + '</span></h3>' +
      '</div>' +
      '<p class="card-desc">' + desc + '</p>' +
      '<div class="card-meta">' + chips + '</div>' +
      '<button class="guide-toggle" type="button" data-guide="' + t.id + '">' + (open ? 'Hide guide ▲' : 'Guide + sources ▼') + '</button>' +
      guideBlock +
      '</article>';
  }

  function filteredTrophies() {
    var q = state.query.trim().toLowerCase();
    return data.trophies.filter(function (t) {
      if (state.filter === 'missable' && !t.missable) return false;
      if (state.filter === 'online') return false;
      if (state.filter !== 'all' && state.filter !== 'missable' && state.filter !== 'online' && t.kind !== state.filter) return false;
      if (q) {
        var hay = (t.name + ' ' + t.description + ' ' + t.where + ' ' + t.guide).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function renderTracker() {
    var list = filteredTrophies();
    var countEl = $('result-count');
    if (state.filter === 'online') {
      countEl.textContent = '0 trophies';
      $('cards').innerHTML = '<div class="empty-state"><b>No online trophies.</b><br>All 55 GTA 6 trophies are single-player — none needs online play, and the game has no online mode at launch.</div>';
      return;
    }
    countEl.textContent = 'Showing ' + list.length + ' of ' + data.trophies.length + ' trophies';
    if (!list.length) {
      $('cards').innerHTML = '<div class="empty-state">No trophies match this filter and search.</div>';
      return;
    }
    $('cards').innerHTML = list.map(trophyCard).join('');
    bindCardEvents($('cards'));
  }

  function bindCardEvents(root) {
    Array.prototype.forEach.call(root.querySelectorAll('[data-check]'), function (box) {
      box.addEventListener('change', function () {
        toggleEarned(parseInt(box.getAttribute('data-check'), 10));
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-guide]'), function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(btn.getAttribute('data-guide'), 10);
        if (state.openIds[id]) delete state.openIds[id]; else state.openIds[id] = true;
        renderAll();
      });
    });
  }

  function roadmapRow(t) {
    var masked = isMasked(t);
    var name = masked ? '<i>Hidden trophy — earn to reveal</i>' : escapeHtml(t.name);
    var flag = t.missable ? '<span class="flag-miss">MISSABLE</span>'
      : (t.chapterGated ? '<span class="flag-gate">CHAPTER-GATED</span>' : '—');
    var count = (t.count === null || t.count === undefined) ? '—' : escapeHtml(String(t.count));
    return '<tr' + (isEarned(t.id) ? ' class="earned-row"' : '') + '>' +
      '<td><input type="checkbox" data-check="' + t.id + '"' + (isEarned(t.id) ? ' checked' : '') + ' aria-label="Mark earned"></td>' +
      '<td><b>' + name + '</b></td><td>' + t.grade + '</td><td>' + escapeHtml(t.where) + '</td>' +
      '<td>' + count + '</td><td>' + flag + '</td></tr>';
  }

  function renderRoadmap() {
    $('roadmap').innerHTML = data.stages.map(function (s) {
      var c = stageCount(s.id);
      var rows = data.trophies.filter(function (t) { return t.stage === s.id; }).map(roadmapRow).join('');
      return '<div class="roadmap-stage" id="stage-' + s.id + '"><h3>Stage ' + s.id + ' — ' + escapeHtml(s.name) +
        '<span class="stage-count">' + c.done + '/' + c.total + '</span></h3>' +
        '<p class="stage-note">' + escapeHtml(s.note) + '</p>' +
        '<table class="roadmap-table"><thead><tr><th></th><th>Trophy</th><th>Grade</th><th>Chapter / mission / activity</th><th>Count</th><th>Flag</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>';
    }).join('');
    bindCardEvents($('roadmap'));
  }

  function renderMissable() {
    var missable = data.trophies.filter(function (t) { return t.missable; });
    var gated = data.trophies.filter(function (t) { return t.chapterGated; });
    var missRows = missable.map(function (t) {
      return '<tr><td><b>' + escapeHtml(t.name) + '</b><br><span style="color:var(--muted)">' + escapeHtml(t.guide) + '</span></td>' +
        '<td>' + t.grade + '</td><td>' + escapeHtml(t.where) + '</td><td>' + escapeHtml(String(t.count)) + '</td></tr>';
    }).join('');
    var gateRows = gated.map(function (t) {
      var name = isMasked(t) ? '<i>Hidden trophy — earn to reveal</i>' : escapeHtml(t.name);
      return '<tr' + (isEarned(t.id) ? ' class="earned-row"' : '') + '><td><b>' + name + '</b></td>' +
        '<td>' + t.grade + '</td><td>' + escapeHtml(t.where) + '</td><td>' + escapeHtml(t.gate) + '</td></tr>';
    }).join('');
    $('missable').innerHTML =
      '<div class="watch-block danger"><h3>Confirmed missable — 1 trophy</h3>' +
      '<table class="watch-table"><thead><tr><th>Trophy</th><th>Grade</th><th>Where</th><th>Count</th></tr></thead><tbody>' + missRows + '</tbody></table>' +
      '<p style="color:var(--muted);font-size:13px;margin:10px 0 0">Source: Sixshore GTA 6 trophy guide; Official PSN trophy list via Exophase &amp; PSNProfiles · read ' + escapeHtml(data.sourcesRead) + '</p></div>' +
      '<div class="watch-block"><h3>Chapter-gated — check before you advance (' + gated.length + ' trophies)</h3>' +
      '<p style="color:var(--muted);font-size:14px;margin:0 0 10px">These are NOT confirmed missable. Each belongs to a story window — a chapter, a mission, or a side strand — so earn it when its window is open and tick it off before moving on.</p>' +
      '<table class="watch-table"><thead><tr><th>Trophy</th><th>Grade</th><th>Window</th><th>Note</th></tr></thead><tbody>' + gateRows + '</tbody></table></div>';
  }

  function renderSources() {
    var rows = Object.keys(data.sources).map(function (key) {
      var s = data.sources[key];
      return '<tr><td><b>' + escapeHtml(s.name) + '</b></td><td>' + escapeHtml(s.read) + '</td>' +
        '<td class="source-count">' + sourceCitationCount(key) + ' / ' + data.trophies.length + '</td>' +
        '<td>' + escapeHtml(s.covers) + '</td></tr>';
    }).join('');
    $('source-matrix').innerHTML =
      '<table class="source-table"><thead><tr><th>Source</th><th>Date read</th><th>Trophies citing it</th><th>What it covers</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>' +
      '<p style="color:var(--muted);font-size:14px;margin-top:12px">Every trophy card carries its own citation chip naming its sources and the date read — ' +
      data.trophies.filter(function (t) { return t.sources && t.sources.length; }).length + ' of ' + data.trophies.length + ' guides are cited.</p>';
  }

  function renderViewVisibility() {
    ['tracker', 'roadmap', 'missable', 'sources'].forEach(function (v) {
      $('view-' + v).hidden = (state.view !== v);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.view-tab'), function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-view') === state.view);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.filter-btn'), function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === state.filter);
    });
    $('spoiler').checked = state.spoiler;
  }

  function renderAll() {
    renderAudit();
    renderHeaderStats();
    renderNextUp();
    renderStageStrip();
    renderViewVisibility();
    renderTracker();
    renderRoadmap();
    renderMissable();
    renderSources();
    syncUrl();
  }

  /* ---------- actions ---------- */

  function toggleEarned(id) {
    if (state.earned[id]) delete state.earned[id]; else state.earned[id] = true;
    saveProgress();
    renderAll();
  }

  function setView(view) {
    state.view = view;
    renderAll();
  }

  function setFilter(filter) {
    state.filter = filter;
    renderAll();
  }

  function setSpoiler(on) {
    state.spoiler = on;
    saveProgress();
    renderAll();
  }

  function exportProgress() {
    var payload = {
      app: 'Leonida Night — GTA 6 Trophy Guide',
      version: 1,
      exportedAt: new Date().toISOString(),
      earned: earnedIds(),
      spoiler: state.spoiler
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'gta6-trophy-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    $('tool-msg').textContent = 'Exported ' + payload.earned.length + ' earned trophies.';
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        var ids = Array.isArray(parsed) ? parsed : parsed.earned;
        if (!Array.isArray(ids)) throw new Error('no earned list');
        var next = {};
        var count = 0;
        ids.forEach(function (id) {
          id = parseInt(id, 10);
          if (id >= 1 && id <= 55) { next[id] = true; count++; }
        });
        state.earned = next;
        if (parsed && typeof parsed.spoiler === 'boolean') state.spoiler = parsed.spoiler;
        saveProgress();
        renderAll();
        $('tool-msg').textContent = 'Imported ' + count + ' earned trophies.';
      } catch (e) {
        $('tool-msg').textContent = 'Import failed: not a Leonida Night progress file.';
      }
    };
    reader.readAsText(file);
  }

  function copyShareLink() {
    syncUrl();
    var url = window.location.href;
    function done() { $('tool-msg').textContent = 'Share link copied.'; }
    function fallback() {
      var input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      try { document.execCommand('copy'); done(); }
      catch (e) { $('tool-msg').textContent = 'Copy failed — copy the address bar URL.'; }
      input.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, fallback);
    } else {
      fallback();
    }
  }

  function resetProgress() {
    state.earned = {};
    saveProgress();
    renderAll();
    $('tool-msg').textContent = 'Progress reset.';
  }

  /* ---------- boot ---------- */

  function bindStaticEvents() {
    Array.prototype.forEach.call(document.querySelectorAll('.view-tab'), function (btn) {
      btn.addEventListener('click', function () { setView(btn.getAttribute('data-view')); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.filter-btn'), function (btn) {
      btn.addEventListener('click', function () { setFilter(btn.getAttribute('data-filter')); });
    });
    $('search').addEventListener('input', function () {
      state.query = $('search').value;
      renderTracker();
    });
    $('spoiler').addEventListener('change', function () { setSpoiler($('spoiler').checked); });
    $('export-btn').addEventListener('click', exportProgress);
    $('import-btn').addEventListener('click', function () { $('import-file').click(); });
    $('import-file').addEventListener('change', function () {
      if ($('import-file').files.length) importProgress($('import-file').files[0]);
      $('import-file').value = '';
    });
    $('copy-link-btn').addEventListener('click', copyShareLink);
    $('reset-btn').addEventListener('click', resetProgress);
  }

  loadProgress();
  parseUrlParams();
  loadData().then(function (d) {
    data = d;
    bindStaticEvents();
    renderAll();
  }).catch(function () {
    $('cards').innerHTML = '<div class="empty-state">Could not load the trophy data. Serve this folder with a static server (for example <b>node serve.ts</b>) and open it over http — browsers block data files on file:// URLs.</div>';
    $('audit-text').textContent = 'Audit unavailable — trophy data failed to load.';
  });
})();
