/**
 * Utility functions for Top-K filtering and softmax.
 * @module topk-utils
 */

/**
 * Applies Top-K filtering to logits.
 * @param {number[]} logits - Array of logits (after optional temperature scaling).
 * @param {number} k - Number of tokens to keep.
 * @returns {number[]} Filtered logits (discarded logits set to -Infinity).
 */
export function topKLogits(logits, k) {
  if (!Number.isInteger(k) || k < 1) throw new Error('k must be a positive integer');
  if (k >= logits.length) return logits.slice();
  // Find the k-th largest logit value
  const sorted = [...logits].sort((a, b) => b - a);
  const kthValue = sorted[k - 1];
  return logits.map(l => l >= kthValue ? l : -Infinity);
}
