import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Enterprise Security Layer for ComplyPRO
 * Focuses on Sandboxing, Path Validation, and Secret Protection.
 */
export class SecurityGuard {
  private static readonly DEFAULT_ROOT = process.env.CODEGUARD_SAFE_ROOT || process.cwd();

  /**
   * Validates and resolves a path within the allowed workspace root.
   * Prevents Path Traversal attacks.
   */
  static resolveSafePath(unsafePath: string, customRoot?: string): string {
    const rootResolved = path.resolve(customRoot || this.DEFAULT_ROOT);
    const candidate = path.resolve(rootResolved, unsafePath);

    // Normalize paths for cross-platform comparison
    const rootComparable = rootResolved.replace(/\\/g, '/').toLowerCase();
    const candComparable = candidate.replace(/\\/g, '/').toLowerCase();

    // Exact match or sub-directory check
    if (candComparable === rootComparable || candComparable.startsWith(rootComparable + '/')) {
      return candidate;
    }

    throw new Error('SECURITY ALERT: Attempted access outside allowed workspace root: ' + unsafePath);
  }

  /**
   * Generates a safe SHA-256 fingerprint for license or API keys without logging secrets.
   */
  static fingerprint(secret: string): string {
    if (!secret) return 'none';
    return crypto.createHash('sha256').update(secret).digest('hex').substring(0, 8);
  }

  /**
   * Redacts common secrets and sensitive patterns from error messages and reports.
   */
  static sanitizeOutput(text: string): string {
    if (!text) return '';
    return text
      .replace(/(?:sk-[a-zA-Z0-9]{20,})/g, 'sk-***REDACTED***')
      .replace(/(?:ghp_[a-zA-Z0-9]{20,})/g, 'ghp_***REDACTED***')
      .replace(/(?:xoxb-[a-zA-Z0-9-]{20,})/g, 'xoxb-***REDACTED***')
      .replace(/(?:Bearer\s+[a-zA-Z0-9._-]{20,})/gi, 'Bearer ***REDACTED***');
  }
}
