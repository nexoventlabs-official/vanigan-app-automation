const path = require('path');
const fs = require('fs');

/**
 * Tamil Nadu districts + assembly constituencies.
 * Source: data/tn-districts.json (38 districts, 234 ACs).
 *
 * Exposed as:
 *   getMap()        → { "Chennai": [ "Mylapore", ... ], ... }
 *   getDistricts()  → [ "Chennai", "Coimbatore", ... ] (alphabetical)
 *   getAssemblies(district)  → array of ACs for that district
 */
const DATA_PATH = path.join(__dirname, '..', 'data', 'tn-districts.json');

let cache;
function getMap() {
  if (cache) return cache;
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);
  // Sort district keys alphabetically + each assembly array alphabetically.
  const sorted = {};
  for (const k of Object.keys(data).sort((a, b) => a.localeCompare(b))) {
    sorted[k] = [...data[k]].sort((a, b) => a.localeCompare(b));
  }
  cache = sorted;
  return cache;
}

function getDistricts() {
  return Object.keys(getMap());
}

function getAssemblies(district) {
  const m = getMap();
  // Case-insensitive lookup
  if (m[district]) return m[district];
  const key = Object.keys(m).find((k) => k.toLowerCase() === String(district || '').toLowerCase());
  return key ? m[key] : [];
}

module.exports = { getMap, getDistricts, getAssemblies };
