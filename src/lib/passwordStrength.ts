// A lightweight entropy-heuristic password strength estimator returning a score
// 0..4 to drive the 4-segment meter in the design. Not a substitute for zxcvbn,
// but dependency-free and good enough to nudge users toward stronger secrets.

export const STRENGTH_SEGMENTS = 4;

export type StrengthScore = 0 | 1 | 2 | 3 | 4;

function charsetSize(password: string): number {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^a-zA-Z0-9]/.test(password)) size += 32;
  return size || 1;
}

// estimateEntropyBits approximates Shannon entropy as length * log2(charset).
export function estimateEntropyBits(password: string): number {
  if (!password) return 0;
  return password.length * Math.log2(charsetSize(password));
}

// scorePassword maps entropy bits to a 0..4 bucket. Thresholds are deliberately
// coarse: <28 weak, <40 fair, <60 good, <80 strong, otherwise excellent.
export function scorePassword(password: string): StrengthScore {
  if (!password) return 0;
  const bits = estimateEntropyBits(password);
  if (bits < 28) return 1;
  if (bits < 40) return 2;
  if (bits < 60) return 3;
  return 4;
}
