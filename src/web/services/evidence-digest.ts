import { computeDeterministicHash } from './audit-ledger-store';

/**
 * Canonical evidence digest helpers.
 *
 * Reuses the established `computeDeterministicHash` (SHA-256, FIPS 180-4,
 * output format `SHA256:<64 lowercase hex>`) so every runtime evidence record
 * carries a genuine, recomputable digest over its own stored content instead
 * of a fabricated placeholder.
 *
 * A digest built by `computeEvidenceDigest` can be verified at any time by
 * recomputing it from the same stored fields and comparing the results
 * (recompute-and-compare). On any failure the sentinel
 * `EVIDENCE_DIGEST_UNAVAILABLE` is returned - never a fake value.
 */

export const EVIDENCE_DIGEST_UNAVAILABLE = 'UNAVAILABLE';

const COMPUTED_DIGEST_PATTERN = /^SHA256:[0-9a-f]{64}$/;

/**
 * Existing Guardian records store a real SHA-256 derived value in a legacy
 * wrapper format: `DIGEST-GUARD-<16 uppercase hex>-SHA256`, produced by
 * `crypto.createHash('sha256').digest('hex').substring(0, 16)` in
 * `src/core/guardian-service.ts`. It is a genuine (truncated) SHA-256 digest,
 * so display code may label it as cryptographic, unlike fixture identifiers
 * such as `DIGEST-RISK-0042-SHA256` or `SIG-911EB3A0C872`.
 */
const GUARDIAN_DIGEST_PATTERN = /^DIGEST-GUARD-[0-9A-F]{16}-SHA256$/;

/**
 * Computes a genuine SHA-256 digest over the canonical JSON serialization of
 * `payload`. Returns `EVIDENCE_DIGEST_UNAVAILABLE` if serialization or hashing
 * fails - never a fabricated value.
 */
export function computeEvidenceDigest(payload: object): string {
  try {
    const digest = computeDeterministicHash(JSON.stringify(payload));
    return COMPUTED_DIGEST_PATTERN.test(digest) ? digest : EVIDENCE_DIGEST_UNAVAILABLE;
  } catch {
    return EVIDENCE_DIGEST_UNAVAILABLE;
  }
}

/**
 * True only for full, recomputable digests produced by
 * `computeEvidenceDigest` (`SHA256:` + 64 hex chars).
 */
export function isComputedEvidenceDigest(
  value: string | null | undefined
): value is string {
  return typeof value === 'string' && COMPUTED_DIGEST_PATTERN.test(value);
}

/**
 * True for values produced by real SHA-256 computations: full computed
 * digests or the legacy Guardian truncated-SHA-256 wrapper format.
 * Fixture identifiers (`DIGEST-RISK-...`, `SIG-...`, `EV-POL-...-DIGEST`)
 * return false.
 */
export function hasCryptographicDigest(
  value: string | null | undefined
): value is string {
  return (
    isComputedEvidenceDigest(value) ||
    (typeof value === 'string' && GUARDIAN_DIGEST_PATTERN.test(value))
  );
}
