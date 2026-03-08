// Load pricing data from JSON – edit pricing.json to add/update models
const _raw = require('./pricing.json');
const MODEL_PRICING = Object.fromEntries(
  Object.entries(_raw).filter(([k]) => !k.startsWith('_'))
);

// Normalize a model identifier to match pricing keys
// Handles versioned names like "claude-sonnet-4-20250514", "gpt-4o-2024-08-06", etc.
function normalizeModelName(name) {
  if (!name) return null;
  let n = name.toLowerCase().trim();

  // Strip leading provider prefixes (e.g. "anthropic/claude-..." or "openai/gpt-...")
  const slashIdx = n.lastIndexOf('/');
  if (slashIdx !== -1) n = n.substring(slashIdx + 1);

  // Direct match first
  if (MODEL_PRICING[n]) return n;

  // Try stripping date suffixes like -20250514, -2024-08-06
  const withoutDate = n.replace(/-\d{4}-?\d{2}-?\d{2}$/, '');
  if (MODEL_PRICING[withoutDate]) return withoutDate;

  // Try stripping :latest or similar tags
  const withoutTag = n.replace(/:(latest|thinking)$/, '');
  if (MODEL_PRICING[withoutTag]) return withoutTag;

  // Fuzzy matching: check if model name starts with a known key
  for (const key of Object.keys(MODEL_PRICING)) {
    if (n.startsWith(key)) return key;
  }

  return null;
}

function getModelPricing(modelName) {
  const key = normalizeModelName(modelName);
  return key ? MODEL_PRICING[key] : null;
}

// Calculate cost for a set of token counts and a model
// Returns cost in USD or null if model is unknown
function calculateCost(modelName, inputTokens, outputTokens, cacheRead, cacheWrite) {
  const pricing = getModelPricing(modelName);
  if (!pricing) return null;

  const input = ((inputTokens || 0) / 1_000_000) * pricing.input;
  const output = ((outputTokens || 0) / 1_000_000) * pricing.output;
  const cr = ((cacheRead || 0) / 1_000_000) * pricing.cacheRead;
  const cw = ((cacheWrite || 0) / 1_000_000) * pricing.cacheWrite;

  return input + output + cr + cw;
}

module.exports = { MODEL_PRICING, normalizeModelName, getModelPricing, calculateCost };
