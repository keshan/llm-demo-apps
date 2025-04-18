/**
 * Utility functions for Top-P (nucleus) filtering and softmax.
 * @module topp-utils
 */

/**
 * Applies Top-P (nucleus) filtering to logits.
 * @param {number[]} logits - Array of logits (after optional temperature scaling).
 * @param {number} p - Probability threshold (0 < p <= 1).
 * @param {number} [epsilon=1e-8] - Tolerance for floating point comparisons.
 * @returns {number[]} Filtered logits (discarded logits set to -Infinity).
 */
export function topPLogits(logits, p, epsilon = 1e-8) {
  if (p <= 0 || p > 1) throw new Error('p must be in (0, 1]');
  // Compute softmax probabilities
  const maxLogit = Math.max(...logits);
  const exps = logits.map(x => Math.exp(x - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map(e => e / sumExps);
  // Sort probabilities and keep track of original indices
  const probWithIdx = probs.map((prob, i) => ({ prob, i }));
  probWithIdx.sort((a, b) => b.prob - a.prob);
  // Cumulative sum and nucleus selection
  let cumSum = 0;
  let thresholdProb = probWithIdx[0].prob; // Always include top-1
  for (let j = 0; j < probWithIdx.length; ++j) {
    cumSum += probWithIdx[j].prob;
    if (cumSum > p + epsilon) break;
    thresholdProb = probWithIdx[j].prob;
  }
  // Mask: keep tokens with prob >= thresholdProb
  return logits.map((logit, i) => (probs[i] + epsilon >= thresholdProb ? logit : -Infinity));
}
