// tracker.js — saved progress: localStorage, export to a file, import back.
export const STORAGE_KEY = "leonida-ledger-progress-v1";

// Load the set of earned trophy ids saved in this browser.
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw);
    return new Set(Array.isArray(ids) ? ids.filter((n) => Number.isInteger(n)) : []);
  } catch (err) {
    return new Set();
  }
}

// Save the set of earned trophy ids in this browser.
export function saveProgress(earnedIds) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earnedIds].sort((a, b) => a - b)));
}

// Download the earned ids as a JSON file the player can keep or share.
export function exportProgress(earnedIds) {
  const blob = new Blob([JSON.stringify({ game: "Grand Theft Auto VI", earned: [...earnedIds].sort((a, b) => a - b) }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gta6-trophy-progress.json";
  link.click();
  URL.revokeObjectURL(url);
}

// Read an exported progress file and return its earned ids, or null when invalid.
export async function importProgressFile(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch (err) {
    return null; // not a JSON file: nothing to import
  }
  const ids = Array.isArray(data) ? data : (data && data.earned);
  if (!Array.isArray(ids)) return null;
  return new Set(ids.filter((n) => Number.isInteger(n)));
}
