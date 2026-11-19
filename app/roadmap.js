// roadmap.js — the six-stage road to the platinum, built from the official descriptions.
export const ROADMAP_STAGES = [
  { stage: 1, title: "Stage 1 — Chapter 1: story start, do the missable first", text: "Play Chapter 1 (Gone Fishing, Breakfast Run) and, before the chapter ends, do Lucia's balcony meditation at Jason's house the morning after Down to Earth — the one missable step in the whole list (Positive Mental Attitude). Keep a manual save from the start of Chapter 1. Also grab the Ocean Beach cocktail (In The Beginning…)." },
  { stage: 2, title: "Stage 2 — Chapters 2–3: both characters, partner play opens", text: "Finish Chapters 2 and 3 (The Cartel Heist, Child's Play, Headliners). Once Jason and Lucia are both playable, partner trophies and two-character activities open up — start them now instead of leaving them all to the end." },
  { stage: 3, title: "Stage 3 — Chapter 4 and the side strands", text: "Finish Chapter 4 (VCIA Takedown, Operation Savage Glory) and work every stranger strand to its last mission: Andy, Kenton, Billy, Randy and Tyrone, plus 8 stranger strands in total (Strangers & Freaks) and Bret's hunt (Fair Game)." },
  { stage: 4, title: "Stage 4 — Activities, skills and chaos", text: "The big activity block: 250 stunts, gold in all 42 Shooting Range challenges, 20 different races, drone-race wins at all 14 locations, all 9 activity types, 50 challenges, 5 enemies in one Combat Focus, the shop, bank-vault and armored-truck robberies, and the odd one-offs (bowling, the showroom smash, the VCIA departure)." },
  { stage: 5, title: "Stage 5 — Collectibles and exploration", text: "Sweep Leonida clean: 3 collectible card sets, WAiNK It at 100 locations, 100 vehicles discovered, all 52 areas explored, all 8 garage properties bought, and 10 vehicles registered to the Scooter Bros app." },
  { stage: 6, title: "Stage 6 — Finale, money and the platinum", text: "Finish the final mission (keep a save just before it), launder $250,000 of Marked Bills, spend $100,000 across all shops, then check the Progress menu for 100% completion (A Long Road). The platinum (Vice Got a Price!) pops with the last trophy." },
];

// Trophies belonging to one roadmap stage, in list order.
export function trophiesForStage(trophies, stage) {
  return trophies.filter((t) => t.stage === stage);
}

// Count how many of a stage's trophies are earned.
export function stageProgress(trophies, stage, earnedIds) {
  const list = trophiesForStage(trophies, stage);
  const done = list.filter((t) => earnedIds.has(t.id)).length;
  return { done, total: list.length };
}

// Render the six roadmap stages into the given list element.
export function renderRoadmap(listEl, trophies, earnedIds) {
  listEl.replaceChildren();
  for (const step of ROADMAP_STAGES) {
    const progress = stageProgress(trophies, step.stage, earnedIds);
    const item = document.createElement("li");
    const heading = document.createElement("h3");
    heading.textContent = step.title;
    const body = document.createElement("p");
    body.textContent = step.text;
    const count = document.createElement("p");
    const countStrong = document.createElement("span");
    countStrong.className = "stage-count";
    countStrong.textContent = progress.done + " of " + progress.total + " trophies earned in this stage";
    count.appendChild(countStrong);
    item.append(heading, body, count);
    listEl.appendChild(item);
  }
}

// Render the missable-trophy panel: the one trophy that can be missed.
export function renderMissables(container, trophies, earnedIds) {
  container.replaceChildren();
  const missable = trophies.filter((t) => t.missable);
  if (missable.length === 0) {
    const none = document.createElement("p");
    none.textContent = "No trophy in this list is missable.";
    container.appendChild(none);
    return;
  }
  for (const trophy of missable) {
    const card = document.createElement("div");
    card.className = "card";
    const head = document.createElement("div");
    head.className = "card-head";
    const title = document.createElement("h3");
    title.textContent = trophy.name + " — MISSABLE";
    head.appendChild(title);
    const guide = document.createElement("p");
    guide.className = "desc";
    guide.textContent = trophy.guide;
    const source = document.createElement("p");
    source.className = "detail source";
    source.textContent = "Source: " + trophy.source;
    card.append(head, guide, source);
    container.appendChild(card);
  }
}
