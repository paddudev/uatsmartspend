// Distinct {id, name} options, sorted by name.
export function uniqueOptions(options) {
  const byId = new Map();
  options.forEach((option) => byId.set(option.id, option));
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// Distinct {id, name} options across every item's list under `key` (e.g. "brands").
export function collectOptions(items, key) {
  return uniqueOptions(items.flatMap((item) => item[key] || []));
}

// Several selections within one filter match any of them; an empty filter matches all.
export function matchesAny(ids, selected) {
  return selected.length === 0 || selected.some((s) => ids.includes(s.id));
}

// Case-insensitive "contains" match; an empty search matches all.
export function matchesSearch(text, search) {
  return (text || "").toLowerCase().includes(search.trim().toLowerCase());
}
