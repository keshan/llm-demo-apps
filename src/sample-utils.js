/**
 * Utility for safe temperature scaling and categorical sampling from logits.
 */

/**
 * Applies temperature scaling to logits, with clamp for small values.
 * @param {number[]} logits
 * @param {number} temperature
 * @returns {number[]}
 */
export function temperatureScale(logits, temperature) {
  const t = Math.max(temperature, 1e-5);
  return logits.map(l => l / t);
}

/**
 * Samples an index from a categorical distribution given logits.
 * @param {number[]} logits
 * @returns {number} sampled index
 */
export function sampleFromLogits(logits) {
  // Convert to softmax probabilities
  const maxLogit = Math.max(...logits);
  const exps = logits.map(x => Math.exp(x - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map(e => e / sumExps);
  // Sample according to categorical distribution
  const r = Math.random();
  let cumSum = 0;
  for (let i = 0; i < probs.length; ++i) {
    cumSum += probs[i];
    if (r < cumSum) return i;
  }
  // Fallback: return last index
  return probs.length - 1;
}

