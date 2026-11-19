// app.js — boot the guide: load the data, render the checklist, wire the controls.
import { loadProgress, saveProgress, exportProgress, importProgressFile } from "./tracker.js";
import { matchesKindFilter, matchesSearch, isSpoilerHidden, displayName, displayDescription } from "./filters.js";
import { renderRoadmap, renderMissables } from "./roadmap.js";

const grid = document.getElementById("trophyGrid");
const detailPane = document.getElementById("detailPane");
const earnedCountEl = document.getElementById("earnedCount");
const progressFill = document.getElementById("progressFill");
const progressSub = document.getElementById("progressSub");
const spoilerToggle = document.getElementById("spoilerToggle");
const searchBox = document.getElementById("searchBox");
const listView = document.getElementById("listView");
const roadmapView = document.getElementById("roadmapView");
const roadmapList = document.getElementById("roadmapList");
const missableList = document.getElementById("missableList");

const params = new URLSearchParams(location.search);
let view = params.get("view") === "roadmap" ? "roadmap" : "list";
let filter = params.get("filter") || "all";
let spoilersHidden = params.get("spoiler") === "1";
let openId = Number(params.get("open")) || null;
let earned = loadProgress();
const seeded = (params.get("earned") || "").split(",").map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 55);
if (seeded.length > 0) earned = new Set(seeded);
if (params.get("spoiler") === "1") spoilersHidden = true;

const data = await (await fetch("data/trophies.json")).json();
const trophies = data.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));
if (openId && !byId.has(openId)) openId = null;
if (!openId) openId = 28; // open the missable trophy's guide by default

spoilerToggle.checked = spoilersHidden;
// Update the progress bar and count in the header.
function updateProgress() {
  const done = earned.size;
  earnedCountEl.textContent = String(done);
  progressFill.style.width = Math.round((done / trophies.length) * 100) + "%";
  progressSub.textContent = Math.round((done / trophies.length) * 100) + "% to the platinum";
}

// Render one trophy card into the grid.
function renderTrophyCard(trophy) {
  const card = document.createElement("article");
  card.className = "card" + (earned.has(trophy.id) ? " earned" : "") + (openId === trophy.id ? " selected" : "");
  const head = document.createElement("div");
  head.className = "card-head";
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = earned.has(trophy.id);
  box.setAttribute("aria-label", "Earned: " + trophy.name);
  box.addEventListener("change", () => {
    if (box.checked) earned.add(trophy.id); else earned.delete(trophy.id);
    saveProgress(earned);
    renderAll();
  });
  const title = document.createElement("h3");
  title.textContent = displayName(trophy, spoilersHidden, earned);
  const grade = document.createElement("span");
  grade.className = "grade grade-" + trophy.grade;
  grade.textContent = trophy.grade;
  head.append(box, title, grade);
  const desc = document.createElement("p");
  desc.className = "desc";
  desc.textContent = displayDescription(trophy, spoilersHidden, earned);
  const flags = document.createElement("div");
  flags.className = "flags";
  if (trophy.missable) {
    const flag = document.createElement("span");
    flag.className = "flag missable";
    flag.textContent = "MISSABLE";
    flags.appendChild(flag);
  }
  if (trophy.hidden) {
    const flag = document.createElement("span");
    flag.className = "flag hidden";
    flag.textContent = "Hidden on PSN";
    flags.appendChild(flag);
  }
  if (isSpoilerHidden(trophy, spoilersHidden, earned)) {
    const flag = document.createElement("span");
    flag.className = "flag spoiled";
    flag.textContent = "Spoiler hidden";
    flags.appendChild(flag);
  }
  const kind = document.createElement("span");
  kind.className = "flag";
  kind.textContent = trophy.kind + " · stage " + trophy.stage;
  flags.appendChild(kind);
  card.append(head, desc, flags);
  card.addEventListener("click", (event) => {
    if (event.target === box) return;
    openId = trophy.id;
    renderAll();
  });
  return card;
}

// Render the open trophy's guide, with its sources, in the detail pane.
function renderDetail() {
  detailPane.replaceChildren();
  const trophy = byId.get(openId);
  if (!trophy) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Click a trophy card to open its guide here.";
    detailPane.appendChild(empty);
    return;
  }
  const title = document.createElement("h2");
  title.textContent = displayName(trophy, spoilersHidden, earned);
  const grade = document.createElement("span");
  grade.className = "grade grade-" + trophy.grade;
  grade.textContent = trophy.grade;
  const desc = document.createElement("p");
  desc.className = "desc";
  desc.textContent = "Official description: " + displayDescription(trophy, spoilersHidden, earned);
  const guideHeading = document.createElement("h4");
  guideHeading.textContent = "Guide";
  const guide = document.createElement("p");
  guide.textContent = trophy.guide;
  const sourceHeading = document.createElement("h4");
  sourceHeading.textContent = "Sources";
  const source = document.createElement("p");
  source.className = "source";
  source.textContent = trophy.source;
  const meta = document.createElement("p");
  meta.className = "source";
  meta.textContent = "Kind: " + trophy.kind + " · Roadmap stage " + trophy.stage + (trophy.missable ? " · MISSABLE — see Stage 1" : "") + (trophy.count ? " · PSN count: " + trophy.count : "") + (earned.has(trophy.id) ? " · Earned" : " · Not earned yet");
  detailPane.append(title, grade, desc, guideHeading, guide, sourceHeading, source, meta);
}

// Render the filtered grid, the detail pane and the roadmap together.
function renderAll() {
  updateProgress();
  grid.replaceChildren();
  const shown = trophies.filter((t) => matchesKindFilter(t, filter) && matchesSearch(t, searchBox.value));
  if (filter === "online" && shown.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No online trophies: every one of the 55 trophies is earned in single-player. Nothing here is locked behind online play.";
    grid.appendChild(empty);
  } else if (shown.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No trophies match this filter and search.";
    grid.appendChild(empty);
  }
  for (const trophy of shown) grid.appendChild(renderTrophyCard(trophy));
  renderDetail();
  renderRoadmap(roadmapList, trophies, earned);
  renderMissables(missableList, trophies, earned);
  document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.filter === filter));
  document.getElementById("viewListBtn").classList.toggle("active", view === "list");
  document.getElementById("viewRoadmapBtn").classList.toggle("active", view === "roadmap");
  listView.hidden = view !== "list";
  roadmapView.hidden = view !== "roadmap";
}

// Switch between the checklist and the roadmap views.
function setView(next) {
  view = next;
  renderAll();
}
document.getElementById("viewListBtn").addEventListener("click", () => setView("list"));
document.getElementById("viewRoadmapBtn").addEventListener("click", () => setView("roadmap"));

// Filter buttons, search box and the spoiler toggle.
document.getElementById("filterBar").addEventListener("click", (event) => {
  const btn = event.target.closest(".filter-btn");
  if (!btn) return;
  filter = btn.dataset.filter;
  renderAll();
});
searchBox.addEventListener("input", renderAll);
spoilerToggle.addEventListener("change", () => {
  spoilersHidden = spoilerToggle.checked;
  renderAll();
});

// Export and import progress.
document.getElementById("exportBtn").addEventListener("click", () => exportProgress(earned));
document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
document.getElementById("importFile").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const imported = await importProgressFile(file);
  if (imported) {
    earned = imported;
    saveProgress(earned);
    renderAll();
  }
  event.target.value = "";
});

renderAll();
