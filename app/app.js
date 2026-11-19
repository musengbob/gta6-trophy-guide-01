/* Leonida Night — GTA 6 trophy guide & tracker, round 3.
   Vanilla JS, no libraries, no network at run time beyond loading this app's
   own files. Data lives in data/trophies.json (the 55 trophies, 174 numbered
   steps, confirmation status), data/sources.json (the 7 cited guides with
   their coverage counts) and data/roadmap.json (the 7-stage platinum roadmap,
   the source of truth for stage assignment). Progress lives in localStorage. */
(function () {
  'use strict';

  var EARNED_KEY = 'leonida-night-earned-v1';
  var SPOILER_KEY = 'leonida-night-spoiler-v1';

  var trophyData = null; // trophies.json: { trophies, sources, points, sourcesRead }
  var sourceData = null; // sources.json: { sources, agreement, method, notes, read }
  var roadmapData = null; // roadmap.json: { stages, overall }
  var stageOf = {}; // trophy id -> stage id, from roadmap.json (source of truth)
  var byId = {}; // trophy id -> trophy

  var state = {
    view: 'tracker',
    filter: 'all',
    confirm: 'all',
    spoiler: false,
    query: '',
    earned: {}
  };

  function $(id) { return document.getElementById(id); }
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- data + state ---------- */

  function loadData() {
    return Promise.all([
      fetch('data/trophies.json').then(function (r) {
        if (!r.ok) throw new Error('trophies.json failed to load');
        return r.json();
      }),
      fetch('data/sources.json').then(function (r) {
        if (!r.ok) throw new Error('sources.json failed to load');
        return r.json();
      }),
      fetch('data/roadmap.json').then(function (r) {
        if (!r.ok) throw new Error('roadmap.json failed to load');
        return r.json();
      })
    ]).then(function (parts) {
      trophyData = parts[0];
      sourceData = parts[1];
      roadmapData = parts[2];
      trophyData.trophies.forEach(function (t) { byId[t.id] = t; });
      // roadmap.json is the source of truth for stage assignment; a trophy's
      // own stage field is only a fallback for one the roadmap does not list.
      roadmapData.stages.forEach(function (s) {
        s.trophies.forEach(function (id) { stageOf[id] = s.id; });
      });
      trophyData.trophies.forEach(function (t) {
        if (stageOf[t.id] === undefined) stageOf[t.id] = t.stage;
      });
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
    var confirm = p.get('confirm');
    if (confirm === 'all' || confirm === 'confirmed' || confirm === 'unconfirmed') state.confirm = confirm;
    var spoiler = p.get('spoiler');
    if (spoiler === 'on') state.spoiler = true;
    if (spoiler === 'off') state.spoiler = false;
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
    if (state.confirm !== 'all') p.set('confirm', state.confirm);
    if (state.spoiler) p.set('spoiler', 'on');
    var ids = earnedIds();
    if (ids.length) p.set('earned', ids.join(','));
    var q = p.toString();
    history.replaceState(null, '', window.location.pathname + (q ? '?' + q : ''));
  }

  /* ---------- computed facts (all counted from the data files) ---------- */

  function gradeCount(grade) {
    return trophyData.trophies.filter(function (t) { return t.grade === grade; }).length;
  }

  function totalPoints() {
    return trophyData.trophies.reduce(function (sum, t) { return sum + trophyData.points[t.grade]; }, 0);
  }

  function earnedPoints() {
    return trophyData.trophies.reduce(function (sum, t) {
      return sum + (isEarned(t.id) ? trophyData.points[t.grade] : 0);
    }, 0);
  }

  function totalSteps() {
    return trophyData.trophies.reduce(function (sum, t) { return sum + (t.steps ? t.steps.length : 0); }, 0);
  }

  function uncertainty() {
    var confirmed = 0, unconfirmed = 0, disagree = 0;
    trophyData.trophies.forEach(function (t) {
      if (t.confirm_status === 'confirmed') confirmed++; else unconfirmed++;
      if (t.disagree) disagree++;
    });
    return { confirmed: confirmed, unconfirmed: unconfirmed, disagree: disagree };
  }

  function stageCount(stageId) {
    var stage = roadmapData.stages.filter(function (s) { return s.id === stageId; })[0];
    var ids = stage ? stage.trophies : [];
    var done = ids.filter(function (id) { return isEarned(id); }).length;
    return { done: done, total: ids.length };
  }

  function computeAudit() {
    var ts = trophyData.trophies;
    var n = ts.length;
    var names = ts.filter(function (t) { return t.name && t.name.trim(); }).length;
    var descs = ts.filter(function (t) { return t.description && t.description.trim(); }).length;
    var guides = ts.filter(function (t) { return t.guide && t.guide.trim(); }).length;
    var cited = ts.filter(function (t) { return t.sources && t.sources.length; }).length;
    var hidden = ts.filter(function (t) { return t.hidden; }).length;
    var unc = uncertainty();
    return '✓ ' + names + '/' + n + ' official names · ' + descs + '/' + n + ' descriptions · ' +
      guides + '/' + n + ' guides · ' + cited + '/' + n + ' cited · ' + totalSteps() + ' numbered steps · ' +
      gradeCount('platinum') + ' platinum · ' + gradeCount('gold') + ' gold · ' +
      gradeCount('silver') + ' silver · ' + gradeCount('bronze') + ' bronze · ' +
      hidden + ' hidden · ' + unc.confirmed + ' confirmed · ' + unc.unconfirmed + ' unconfirmed · ' +
      unc.disagree + ' disputed · Sources read ' + trophyData.sourcesRead;
  }

  /* ---------- planner ---------- */

  function nextUpList() {
    var todo = trophyData.trophies.filter(function (t) { return !isEarned(t.id); });
    function priority(t) {
      if (t.missable) return 0;
      if (t.chapterGated) return 1;
      return 2;
    }
    todo.sort(function (a, b) {
      var pa = priority(a), pb = priority(b);
      if (pa !== pb) return pa - pb;
      if (stageOf[a.id] !== stageOf[b.id]) return stageOf[a.id] - stageOf[b.id];
      return a.id - b.id;
    });
    return todo.slice(0, 3).map(function (t) {
      var why;
      if (t.missable) why = 'MISSABLE — do it before Chapter 1 ends';
      else if (t.chapterGated) why = 'Chapter-gated — earn it before advancing';
      else why = 'Stage ' + stageOf[t.id] + ' — next in the roadmap';
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
    $('progress-value').textContent = ids.length + ' / ' + trophyData.trophies.length;
    $('progress-fill').style.width = (ids.length / trophyData.trophies.length * 100) + '%';
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
      var name = isMasked(t) ? 'Hidden trophy (Stage ' + stageOf[t.id] + ')' : escapeHtml(t.name);
      return '<li><b>' + name + '</b> <span class="why">— ' + escapeHtml(item.why) + ' · ' + escapeHtml(t.where) + '</span></li>';
    }).join('');
  }

  function renderStageStrip() {
    $('stage-strip').innerHTML = roadmapData.stages.map(function (s) {
      var c = stageCount(s.id);
      var done = c.done === c.total ? ' done' : '';
      return '<button class="stage-chip' + done + '" type="button" data-stage="' + s.id + '">' +
        'Stage ' + s.id + ': <b>' + c.done + '/' + c.total + '</b> · ' + escapeHtml(s.name) + '</button>';
    }).join('');
  }

  function renderSourceRail() {
    var unc = uncertainty();
    Array.prototype.forEach.call(document.querySelectorAll('.rail-item'), function (item) {
      var key = item.getAttribute('data-source');
      var src = sourceData.sources.filter(function (s) { return s.key === key; })[0];
      if (!src) return;
      var count = src.trophies.length;
      var countEl = item.querySelector('.rail-count');
      countEl.textContent = 'cited by ' + count + ' of ' + trophyData.trophies.length;
      countEl.setAttribute('data-coverage', String(count));
    });
    $('rail-agreement').textContent = 'Agreement: ' + unc.confirmed + ' of ' + trophyData.trophies.length +
      ' triggers confirmed by 4+ sources; ' + unc.unconfirmed + ' unconfirmed; ' + unc.disagree +
      ' disputed (PowerPyx asserts, others do not).';
  }

  function renderBackupBytes() {
    var keyEl = $('storage-key');
    if (keyEl) keyEl.textContent = EARNED_KEY;
    var bytesEl = $('storage-bytes');
    if (!bytesEl) return;
    var bytes = 0;
    try {
      var value = localStorage.getItem(EARNED_KEY) || '';
      bytes = new TextEncoder().encode(value).length;
    } catch (e) { bytes = 0; }
    bytesEl.textContent = bytes + ' bytes';
  }

  function updateConfirmLabels() {
    var sel = $('confirm-filter');
    var unc = uncertainty();
    sel.options[0].textContent = 'All — ' + trophyData.trophies.length + ' trophies';
    sel.options[1].textContent = 'Confirmed only — ' + unc.confirmed;
    sel.options[2].textContent = 'Unconfirmed only — ' + unc.unconfirmed;
  }

  function trophyCard(t) {
    var tpl = $('trophy-card-template');
    var frag = tpl.content.cloneNode(true);
    var card = frag.querySelector('.trophy-card');
    var masked = isMasked(t);
    var earned = isEarned(t.id);
    card.setAttribute('data-trophy-id', String(t.id));
    card.setAttribute('data-grade', t.grade);
    card.setAttribute('data-kind', t.kind);
    card.setAttribute('data-confirm-status', t.confirm_status);
    card.setAttribute('data-missable', t.missable ? 'true' : 'false');
    card.setAttribute('data-stage', String(stageOf[t.id]));
    card.classList.add('grade-' + t.grade);
    if (earned) card.classList.add('earned');
    if (masked) card.classList.add('masked');
    var box = card.querySelector('[data-action="toggle-earned"]');
    box.checked = earned;
    box.setAttribute('data-id', String(t.id));
    box.setAttribute('aria-label', 'Mark trophy ' + t.id + ' earned');
    var confirmEl = card.querySelector('[data-field="confirm_status"]');
    var confirmLabel = t.disagree ? 'Disputed' : (t.confirm_status === 'unconfirmed' ? 'Unconfirmed' : 'Confirmed');
    confirmEl.textContent = confirmLabel;
    confirmEl.classList.add(t.disagree ? 'confirm-disputed' : (t.confirm_status === 'unconfirmed' ? 'confirm-unconfirmed' : 'confirm-confirmed'));
    card.querySelector('[data-field="grade"]').textContent = t.grade;
    var nameEl = card.querySelector('[data-field="name"]');
    var descEl = card.querySelector('[data-field="description"]');
    var guideEl = card.querySelector('[data-field="guide"]');
    var stepsEl = card.querySelector('[data-field="steps"]');
    if (masked) {
      nameEl.textContent = 'Hidden trophy — earn to reveal';
      descEl.textContent = 'Hidden on PlayStation until earned.';
      guideEl.textContent = 'Guide hidden until this trophy is earned — spoiler-safe mode is on.';
    } else {
      nameEl.textContent = t.name;
      descEl.textContent = t.description;
      guideEl.textContent = t.guide;
      (t.steps || []).forEach(function (st) {
        var li = document.createElement('li');
        var textSpan = document.createElement('span');
        textSpan.className = 'step-text';
        textSpan.textContent = st.text;
        li.appendChild(textSpan);
        if (st.sources && st.sources.length) {
          var srcSpan = document.createElement('span');
          srcSpan.className = 'step-sources';
          srcSpan.textContent = ' — ' + st.sources.join(', ');
          li.appendChild(srcSpan);
        }
        stepsEl.appendChild(li);
      });
    }
    card.querySelector('[data-field="where"]').textContent = t.where;
    var names = (t.sources || []).map(function (key) {
      var s = trophyData.sources[key];
      return s ? s.name : key;
    });
    card.querySelector('[data-field="sources"]').textContent = names.join('; ') + ' · read ' + trophyData.sourcesRead;
    if (t.confirm_note && !masked) {
      var note = document.createElement('p');
      note.className = 'card-note';
      note.textContent = t.confirm_note;
      card.appendChild(note);
    }
    return frag;
  }

  function filteredTrophies() {
    var q = state.query.trim().toLowerCase();
    return trophyData.trophies.filter(function (t) {
      if (state.filter === 'missable' && !t.missable) return false;
      if (state.filter === 'online') return false;
      if (state.filter !== 'all' && state.filter !== 'missable' && state.filter !== 'online' && t.kind !== state.filter) return false;
      if (state.confirm === 'confirmed' && t.confirm_status !== 'confirmed') return false;
      if (state.confirm === 'unconfirmed' && t.confirm_status !== 'unconfirmed') return false;
      if (q) {
        var stepsText = (t.steps || []).map(function (s) { return s.text; }).join(' ');
        var hay = (t.name + ' ' + t.description + ' ' + t.where + ' ' + t.guide + ' ' + stepsText).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function renderTracker() {
    var list = filteredTrophies();
    var countEl = $('result-count');
    var cardsEl = $('cards');
    if (state.filter === 'online') {
      countEl.textContent = '0 trophies';
      cardsEl.innerHTML = '<div class="empty-state"><b>No online trophies.</b><br>All 55 GTA 6 trophies are single-player — none needs online play, and the game has no online mode at launch.</div>';
      return;
    }
    countEl.textContent = 'Showing ' + list.length + ' of ' + trophyData.trophies.length + ' trophies';
    if (!list.length) {
      cardsEl.innerHTML = '<div class="empty-state">No trophies match this filter and search.</div>';
      return;
    }
    cardsEl.innerHTML = '';
    list.forEach(function (t) { cardsEl.appendChild(trophyCard(t)); });
  }

  function roadmapItem(t) {
    var masked = isMasked(t);
    var earned = isEarned(t.id);
    var name = masked ? '<i>Hidden trophy — earn to reveal</i>' : escapeHtml(t.name);
    var flags = '';
    if (t.missable) flags += ' <span class="flag-miss">MISSABLE</span>';
    if (t.chapterGated) flags += ' <span class="flag-gate">CHAPTER-GATED</span>';
    return '<li' + (earned ? ' class="earned-row"' : '') + '><label>' +
      '<input type="checkbox" data-check="' + t.id + '"' + (earned ? ' checked' : '') + ' aria-label="Mark earned"> ' +
      '<b>' + name + '</b> <span class="rt-grade">' + escapeHtml(t.grade) + '</span>' + flags + '</label></li>';
  }

  function renderRoadmap() {
    roadmapData.stages.forEach(function (s) {
      var article = document.querySelector('.roadmap-stage[data-stage-id="' + s.id + '"]');
      if (!article) return;
      var c = stageCount(s.id);
      var diffEl = article.querySelector('[data-field="difficulty"]');
      if (diffEl) diffEl.textContent = 'Difficulty ' + s.difficulty;
      var hoursEl = article.querySelector('[data-field="hours"]');
      if (hoursEl) hoursEl.textContent = s.hours === 0 ? '0 hours — pops automatically' : s.hours + (s.hours === 1 ? ' hour' : ' hours');
      var countEl = article.querySelector('[data-field="count"]');
      if (countEl) countEl.textContent = c.total + (c.total === 1 ? ' trophy' : ' trophies');
      var earnedEl = article.querySelector('[data-field="earned"]');
      if (earnedEl) earnedEl.textContent = c.done + ' / ' + c.total + ' earned';
      var listEl = article.querySelector('[data-field="trophies"]');
      if (listEl) {
        listEl.innerHTML = s.trophies.map(function (id) {
          var t = byId[id];
          return t ? roadmapItem(t) : '';
        }).join('');
      }
    });
  }

  function renderMissable() {
    var missable = trophyData.trophies.filter(function (t) { return t.missable; });
    var gated = trophyData.trophies.filter(function (t) { return t.chapterGated; });
    var missRows = missable.map(function (t) {
      return '<tr><td><b>' + escapeHtml(t.name) + '</b><br><span style="color:var(--muted)">' + escapeHtml(t.guide) + '</span></td>' +
        '<td>' + escapeHtml(t.grade) + '</td><td>' + escapeHtml(t.where) + '</td><td>' + escapeHtml(String(t.count)) + '</td></tr>';
    }).join('');
    var gateRows = gated.map(function (t) {
      var name = isMasked(t) ? '<i>Hidden trophy — earn to reveal</i>' : escapeHtml(t.name);
      return '<tr' + (isEarned(t.id) ? ' class="earned-row"' : '') + '><td><b>' + name + '</b></td>' +
        '<td>' + escapeHtml(t.grade) + '</td><td>' + escapeHtml(t.where) + '</td><td>' + escapeHtml(t.gate || '') + '</td></tr>';
    }).join('');
    $('missable').innerHTML =
      '<div class="watch-block danger"><h3>Confirmed missable — ' + missable.length + ' trophy</h3>' +
      '<table class="watch-table"><thead><tr><th>Trophy</th><th>Grade</th><th>Where</th><th>Count</th></tr></thead><tbody>' + missRows + '</tbody></table>' +
      '<p style="color:var(--muted);font-size:13px;margin:10px 0 0">Source: the 7 cited guides · read ' + escapeHtml(sourceData.read) + '</p></div>' +
      '<div class="watch-block"><h3>Chapter-gated — check before you advance (' + gated.length + ' trophies)</h3>' +
      '<p style="color:var(--muted);font-size:14px;margin:0 0 10px">These are NOT confirmed missable. Each belongs to a story window — a chapter, a mission, or a side strand — so earn it when its window is open and tick it off before moving on.</p>' +
      '<table class="watch-table"><thead><tr><th>Trophy</th><th>Grade</th><th>Window</th><th>Note</th></tr></thead><tbody>' + gateRows + '</tbody></table></div>';
  }

  function renderSources() {
    var rows = sourceData.sources.map(function (s) {
      return '<tr><td><b>' + escapeHtml(s.name) + '</b></td><td>' + escapeHtml(s.read) + '</td>' +
        '<td class="source-count">' + s.trophies.length + ' / ' + trophyData.trophies.length + '</td>' +
        '<td>' + escapeHtml(s.note) + '</td></tr>';
    }).join('');
    var unc = uncertainty();
    var notes = (sourceData.notes || []).map(function (n) {
      return '<li>' + escapeHtml(n) + '</li>';
    }).join('');
    $('source-matrix').innerHTML =
      '<table class="source-table"><thead><tr><th>Source</th><th>Date read</th><th>Trophies citing it</th><th>What it covers</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>' +
      '<p style="color:var(--muted);font-size:14px;margin-top:12px">' + escapeHtml(sourceData.method) + '</p>' +
      '<p style="font-size:14px;margin-top:8px">Agreement: <b>' + unc.confirmed + ' confirmed</b> by 4+ sources · ' +
      '<b>' + unc.unconfirmed + ' unconfirmed</b> · <b>' + unc.disagree + ' disputed</b> (PowerPyx asserts a method, other guides do not).</p>' +
      (notes ? '<ul style="color:var(--muted);font-size:14px">' + notes + '</ul>' : '');
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
    $('confirm-filter').value = state.confirm;
    $('spoiler').checked = state.spoiler;
  }

  function renderAll() {
    renderAudit();
    renderHeaderStats();
    renderNextUp();
    renderStageStrip();
    renderSourceRail();
    renderBackupBytes();
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

  function setConfirm(confirm) {
    state.confirm = confirm;
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
    $('confirm-filter').addEventListener('change', function () { setConfirm($('confirm-filter').value); });
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
    // Earned toggles, delegated: the cards and roadmap lists are re-rendered,
    // but their containers persist, so one listener each is enough.
    $('cards').addEventListener('change', function (e) {
      var box = e.target;
      if (box && box.matches && box.matches('[data-action="toggle-earned"]')) {
        toggleEarned(parseInt(box.getAttribute('data-id'), 10));
      }
    });
    $('roadmap').addEventListener('change', function (e) {
      var box = e.target;
      if (box && box.matches && box.matches('[data-check]')) {
        toggleEarned(parseInt(box.getAttribute('data-check'), 10));
      }
    });
    $('stage-strip').addEventListener('click', function (e) {
      var chip = e.target && e.target.closest ? e.target.closest('.stage-chip') : null;
      if (chip) setView('roadmap');
    });
  }

  loadProgress();
  parseUrlParams();
  loadData().then(function () {
    bindStaticEvents();
    updateConfirmLabels();
    renderAll();
  }).catch(function () {
    $('cards').innerHTML = '<div class="empty-state">Could not load the trophy data. Serve this folder with a static server (for example <b>node serve.ts</b>) and reload the page — browsers block data files when the page is opened straight from disk.</div>';
    $('audit-text').textContent = 'Audit unavailable — trophy data failed to load.';
  });
})();
