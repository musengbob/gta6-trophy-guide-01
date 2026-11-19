// filters.js — kind filters, text search and the spoiler rule.
export const FILTERS = ["all", "story", "missable", "collectibles", "activities", "online"];

// Does one trophy pass the active kind filter?
export function matchesKindFilter(trophy, filter) {
  if (filter === "all") return true;
  if (filter === "missable") return trophy.missable === true;
  if (filter === "online") return trophy.kind === "online";
  return trophy.kind === filter;
}

// Does one trophy pass the search text (name only, case-insensitive)?
export function matchesSearch(trophy, query) {
  if (!query) return true;
  return trophy.name.toLowerCase().includes(query.trim().toLowerCase());
}

// The spoiler rule: with spoilers hidden, a story trophy stays masked until earned.
export function isSpoilerHidden(trophy, spoilersHidden, earnedIds) {
  return spoilersHidden && trophy.kind === "story" && !earnedIds.has(trophy.id);
}

// The display name: masked story trophies show a placeholder, never their name.
export function displayName(trophy, spoilersHidden, earnedIds) {
  return isSpoilerHidden(trophy, spoilersHidden, earnedIds) ? "Hidden story trophy" : trophy.name;
}

// The display description: masked story trophies hide theirs until earned.
export function displayDescription(trophy, spoilersHidden, earnedIds) {
  return isSpoilerHidden(trophy, spoilersHidden, earnedIds) ? "Earn this trophy to reveal its name and description." : trophy.description;
}
