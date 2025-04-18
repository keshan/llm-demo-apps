/**
 * Utility functions for Min-P filtering and softmax.
 * @module minp-utils
 */

/**
 * Numerically stable softmax implementation.
 * @param {number[]} logits - Array of logits.
 * @returns {number[]} Probabilities.
 */
export function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const exps = logits.map(x => Math.exp(x - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sumExps);
}

/**
 * Applies Min-P filtering to logits.
 * @param {number[]} logits - Array of logits (after optional temperature scaling).
 * @param {number} minP - The min_p parameter (0 < minP < 1).
 * @param {number} [epsilon=1e-8] - Tolerance for max prob equality.
 * @returns {number[]} Filtered logits (discarded logits set to -Infinity).
 */
export function minPLogits(logits, minP, epsilon = 1e-8) {
  if (minP <= 0 || minP >= 1) throw new Error('minP must be in (0, 1)');
  const probs = softmax(logits);
  const maxProb = Math.max(...probs);
  const threshold = maxProb * minP;
  return logits.map((logit, i) => {
    // Always keep max prob tokens
    if (Math.abs(probs[i] - maxProb) < epsilon) return logit;
    // Keep if above threshold, else discard
    return probs[i] >= threshold ? logit : -Infinity;
  });
}
