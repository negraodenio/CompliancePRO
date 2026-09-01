/**
 * CG-AG FRIENDLY ERROR HANDLING — COMPREHENSIVE TEST SUITE
 * ============================================================
 * Covers:
 *  1.  Canonical error code creation
 *  2.  Friendly messages (user-facing)
 *  3.  Severity per code
 *  4.  Retryability per code
 *  5.  Category per code
 *  6.  Secret sanitization — strings
 *  7.  Secret sanitization — nested objects
 *  8.  JWT sanitization
 *  9.  Bearer token sanitization
 *  10. API key sanitization
 *  11. Filesystem path sanitization
 *  12. MCP error envelope structure
 *  13. Stack trace isolation (never in user output)
 *  14. technicalDetails isolation (never in user output)
 *  15. CAPABILITY_NOT_VERIFIED epistemic invariant
 *  16. EVIDENCE_NOT_FOUND epistemic invariant
 *  17. HTTP status mapping
 *  18. fromUnknown conversion
 *  19. No specific secret values in any output
 *
 * SAFETY: No real secret values are used — all test credentials are
 * clearly synthetic patterns that would be caught by the sanitiser.
 */

import {
  CGAGError,
  CGAGErrorFactory,
  CGAGErrorCatalog,
  ErrorSanitizer,
  getHttpStatus
} from '../src/core/errors';

// ────────────────────────────────────────────────────────────
// Test runner helpers
// ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  [PASS] ${label}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${label}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

function section(title: string): void {
  console.log(`\n[TEST] ${title}`);
}

// ────────────────────────────────────────────────────────────
// Synthetic test credentials (clearly synthetic — never real)
// ────────────────────────────────────────────────────────────

const SYNTHETIC_SK_KEY    = 'sk-testfakeapikey12345678901234567890abcdef';
const SYNTHETIC_OR_KEY    = 'sk-or-v1-testfakeopenrouterkey12345678901234567890abcdef';
const SYNTHETIC_GHP_TOKEN = 'ghp_testfakegithubtoken1234567890abcd';
const SYNTHETIC_JWT       = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0dXNlciIsInRlbmFudCI6IlRFTkFOVC1GQUtFIn0.FAKESIGNATURE1234567890';
const SYNTHETIC_BEARER    = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.FAKETOKEN12345678901234';
const SYNTHETIC_PASS      = 'password=SuperSecretPassword123!';
const SYNTHETIC_CONN_STR  = 'postgres://dbuser:secret@localhost:5432/mydb';
const SYNTHETIC_WIN_PATH  = 'C:\\Users\\testuser\\AppData\\Roaming\\secrets\\config.json';
const SYNTHETIC_UNIX_PATH = '/home/ubuntu/secrets/service-key.json';
const SYNTHETIC_SUPABASE_ROLE = 'SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.FAKESIG12345';

// ────────────────────────────────────────────────────────────
// 1. CANONICAL ERROR CREATION
// ────────────────────────────────────────────────────────────

section('1 & 2 & 3 & 4 & 5. Canonical error creation, message, severity, retryable, category');

const authErr = CGAGErrorFactory.create('AUTH_REQUIRED');
assert(authErr instanceof CGAGError, 'AUTH_REQUIRED is a CGAGError instance');
assert(authErr.code === 'AUTH_REQUIRED', 'AUTH_REQUIRED code correct');
assert(typeof authErr.message === 'string' && authErr.message.length > 0, 'AUTH_REQUIRED has friendly message');
assert(authErr.severity === 'warning', 'AUTH_REQUIRED severity is warning');
assert(authErr.retryable === false, 'AUTH_REQUIRED is not retryable');
assert(authErr.category === 'authentication', 'AUTH_REQUIRED category is authentication');

const scanTimeout = CGAGErrorFactory.create('SCAN_TIMEOUT');
assert(scanTimeout.retryable === true, 'SCAN_TIMEOUT is retryable');
assert(scanTimeout.severity === 'error', 'SCAN_TIMEOUT severity is error');

const ledgerFail = CGAGErrorFactory.create('LEDGER_VERIFICATION_FAILED');
assert(ledgerFail.severity === 'critical', 'LEDGER_VERIFICATION_FAILED severity is critical');
assert(ledgerFail.retryable === false, 'LEDGER_VERIFICATION_FAILED is not retryable');

const rateLimited = CGAGErrorFactory.create('RATE_LIMITED');
assert(rateLimited.retryable === true, 'RATE_LIMITED is retryable');

const providerUnavail = CGAGErrorFactory.create('PROVIDER_UNAVAILABLE');
assert(providerUnavail.retryable === true, 'PROVIDER_UNAVAILABLE is retryable');

const hitlRequired = CGAGErrorFactory.create('HITL_REQUIRED');
assert(hitlRequired.retryable === false, 'HITL_REQUIRED is not retryable');
assert(hitlRequired.category === 'governance', 'HITL_REQUIRED category is governance');

const policyBlocked = CGAGErrorFactory.create('POLICY_BLOCKED');
assert(policyBlocked.retryable === false, 'POLICY_BLOCKED is not retryable');

// All 21 codes are in catalog
const allCodes: string[] = [
  'AUTH_REQUIRED', 'AUTH_FORBIDDEN', 'TENANT_ACCESS_DENIED', 'RESOURCE_NOT_FOUND',
  'INVALID_REQUEST', 'INVALID_REPOSITORY', 'REPOSITORY_UNAVAILABLE', 'SCAN_FAILED',
  'SCAN_TIMEOUT', 'PROVIDER_UNAVAILABLE', 'RATE_LIMITED', 'MCP_CONNECTION_FAILED',
  'MCP_UNAUTHORIZED', 'MCP_TOOL_DENIED', 'POLICY_BLOCKED', 'HITL_REQUIRED',
  'CAPABILITY_NOT_VERIFIED', 'EVIDENCE_NOT_FOUND', 'EVIDENCE_NOT_VERIFIED',
  'LEDGER_VERIFICATION_FAILED', 'INTERNAL_ERROR'
];
assert(allCodes.every(c => c in CGAGErrorCatalog), 'All 21 canonical codes present in catalog');

// ────────────────────────────────────────────────────────────
// 6. STRING SANITIZATION
// ────────────────────────────────────────────────────────────

section('6. String sanitization — basic patterns');

const sanitizedSK = ErrorSanitizer.sanitizeString(`Error fetching: ${SYNTHETIC_SK_KEY}`);
assert(!sanitizedSK.includes(SYNTHETIC_SK_KEY), 'sk- API key is redacted from string');
assert(sanitizedSK.includes('[REDACTED'), 'sk- API key replaced with [REDACTED marker');

const sanitizedOR = ErrorSanitizer.sanitizeString(`Key: ${SYNTHETIC_OR_KEY}`);
assert(!sanitizedOR.includes(SYNTHETIC_OR_KEY), 'OpenRouter key is redacted');

const sanitizedGHP = ErrorSanitizer.sanitizeString(`token=${SYNTHETIC_GHP_TOKEN}`);
assert(!sanitizedGHP.includes(SYNTHETIC_GHP_TOKEN), 'GitHub token is redacted');

const sanitizedPass = ErrorSanitizer.sanitizeString(SYNTHETIC_PASS);
assert(!sanitizedPass.includes('SuperSecretPassword123'), 'Password value is redacted');

const sanitizedConn = ErrorSanitizer.sanitizeString(SYNTHETIC_CONN_STR);
assert(!sanitizedConn.includes('secret@localhost'), 'Connection string is redacted');

// ────────────────────────────────────────────────────────────
// 7. NESTED OBJECT SANITIZATION
// ────────────────────────────────────────────────────────────

section('7. Nested object sanitization');

const nestedObj = {
  level1: {
    apiKey: SYNTHETIC_SK_KEY,
    nested: {
      token: SYNTHETIC_JWT,
      config: { password: 'SuperSecret' }
    }
  },
  arr: [SYNTHETIC_GHP_TOKEN, 'safe-value']
};

const sanitizedObj = ErrorSanitizer.sanitize(nestedObj);
const sanitizedStr = JSON.stringify(sanitizedObj);
assert(!sanitizedStr.includes(SYNTHETIC_SK_KEY), 'Nested API key redacted');
assert(!sanitizedStr.includes('SuperSecret'), 'Nested password-like value redacted via pattern');
assert(sanitizedStr.includes('safe-value'), 'Non-secret value preserved');

// ────────────────────────────────────────────────────────────
// 8. JWT SANITIZATION
// ────────────────────────────────────────────────────────────

section('8. JWT sanitization');

const sanitizedJWT = ErrorSanitizer.sanitizeString(`Authorization: ${SYNTHETIC_JWT}`);
assert(!sanitizedJWT.includes('FAKESIGNATURE'), 'JWT signature is redacted');
assert(!sanitizedJWT.includes('eyJhbGciOiJIUzI1NiJ9'), 'JWT header is redacted');

// ────────────────────────────────────────────────────────────
// 9. BEARER TOKEN SANITIZATION
// ────────────────────────────────────────────────────────────

section('9. Bearer token sanitization');

const sanitizedBearer = ErrorSanitizer.sanitizeString(`Header: ${SYNTHETIC_BEARER}`);
assert(!sanitizedBearer.includes('FAKETOKEN'), 'Bearer token value is redacted');

// ────────────────────────────────────────────────────────────
// 10. API KEY SANITIZATION (OPENROUTER, SILICONFLOW, SUPABASE)
// ────────────────────────────────────────────────────────────

section('10. Specific API key sanitization — OPENROUTER, SILICONFLOW, SUPABASE_SERVICE_ROLE');

const sanitizedSupabase = ErrorSanitizer.sanitizeString(SYNTHETIC_SUPABASE_ROLE);
assert(!sanitizedSupabase.includes('FAKESIG12345'), 'SUPABASE_SERVICE_ROLE_KEY value is redacted');

const sensitiveErrorMsg = `OPENROUTER_API_KEY=${SYNTHETIC_OR_KEY} caused failure`;
const sanitizedMsg = ErrorSanitizer.sanitizeString(sensitiveErrorMsg);
assert(!sanitizedMsg.includes(SYNTHETIC_OR_KEY), 'OPENROUTER_API_KEY value redacted from error message');

// ────────────────────────────────────────────────────────────
// 11. FILESYSTEM PATH SANITIZATION
// ────────────────────────────────────────────────────────────

section('11. Filesystem path sanitization');

const sanitizedWin = ErrorSanitizer.sanitizeString(`Failed reading ${SYNTHETIC_WIN_PATH}`);
assert(!sanitizedWin.includes('AppData'), 'Windows path is redacted');

const sanitizedUnix = ErrorSanitizer.sanitizeString(`File not found: ${SYNTHETIC_UNIX_PATH}`);
assert(!sanitizedUnix.includes('service-key.json'), 'Unix path is redacted');

// ────────────────────────────────────────────────────────────
// 12. MCP ERROR ENVELOPE
// ────────────────────────────────────────────────────────────

section('12. MCP error envelope structure');

const rawError = new Error(`INTERNAL: Failed to connect — key=${SYNTHETIC_SK_KEY}`);
const envelope = ErrorSanitizer.toMcpErrorEnvelope(rawError);

assert('error' in envelope, 'MCP envelope has error field');
assert('code' in envelope.error, 'MCP envelope error has code');
assert('message' in envelope.error, 'MCP envelope error has message');
assert('retryable' in envelope.error, 'MCP envelope error has retryable');
assert(!('stack' in envelope.error), 'MCP envelope error has NO stack');
assert(!('technicalDetails' in envelope.error), 'MCP envelope error has NO technicalDetails');

const envelopeStr = JSON.stringify(envelope);
assert(!envelopeStr.includes(SYNTHETIC_SK_KEY), 'MCP envelope contains NO raw API key');
assert(!envelopeStr.includes('INTERNAL:'), 'MCP envelope contains NO internal error prefix');

// ────────────────────────────────────────────────────────────
// 13. STACK TRACE ISOLATION
// ────────────────────────────────────────────────────────────

section('13. Stack trace isolation — never in user output');

const errWithStack = CGAGErrorFactory.create('INTERNAL_ERROR', {
  technicalDetails: 'at Object.<anonymous> (/home/ubuntu/app/server.ts:42)\n  at Module._compile'
});

const userOutput = errWithStack.toUserError();
const userOutputStr = JSON.stringify(userOutput);
assert(!userOutputStr.includes('at Object'), 'Stack trace not in user output');
assert(!userOutputStr.includes('.ts:42'), 'File path not in user output');
assert(!userOutputStr.includes('technicalDetails'), 'technicalDetails field not in user output');

// ────────────────────────────────────────────────────────────
// 14. technicalDetails ISOLATION
// ────────────────────────────────────────────────────────────

section('14. technicalDetails isolation — internal log vs user output');

const errWithDetails = CGAGErrorFactory.create('SCAN_FAILED', {
  technicalDetails: `Scan crashed at line 99, token=${SYNTHETIC_SK_KEY}`
});

const userOut = errWithDetails.toUserError();
assert(!JSON.stringify(userOut).includes('technicalDetails'), 'technicalDetails absent from user output');
assert(!JSON.stringify(userOut).includes(SYNTHETIC_SK_KEY), 'Secret absent from user output');

const internalLog = errWithDetails.toInternalLog();
// Internal log has technicalDetails but sanitised
if (internalLog.technicalDetails) {
  assert(!internalLog.technicalDetails.includes(SYNTHETIC_SK_KEY), 'technicalDetails are sanitised even in internal log');
}
assert(!JSON.stringify(internalLog).includes('cause'), 'cause suppressed in internal log');

// ────────────────────────────────────────────────────────────
// 15. CAPABILITY_NOT_VERIFIED — EPISTEMIC INVARIANT
// ────────────────────────────────────────────────────────────

section('15. CAPABILITY_NOT_VERIFIED — epistemic invariant (OBSERVED ≠ AUTHORIZED)');

const capErr = CGAGErrorFactory.create('CAPABILITY_NOT_VERIFIED');
assert(
  capErr.message.toLowerCase().includes('identificada'),
  'CAPABILITY_NOT_VERIFIED message says capability was "identified" (observed)'
);
assert(
  capErr.message.toLowerCase().includes('verificada'),
  'CAPABILITY_NOT_VERIFIED message says authorization "not verified" (not "not authorized")'
);
// Critical: the message must NOT claim the capability is unauthorized or doesn't exist
assert(
  !capErr.message.toLowerCase().includes('não autorizada'),
  'CAPABILITY_NOT_VERIFIED does NOT say "não autorizada" (preserves OBSERVED ≠ AUTHORIZED)'
);
assert(
  !capErr.message.toLowerCase().includes('não existe'),
  'CAPABILITY_NOT_VERIFIED does NOT claim non-existence'
);

// ────────────────────────────────────────────────────────────
// 16. EVIDENCE_NOT_FOUND — EPISTEMIC INVARIANT
// ────────────────────────────────────────────────────────────

section('16. EVIDENCE_NOT_FOUND — epistemic invariant (absence ≠ non-existence)');

const evidErr = CGAGErrorFactory.create('EVIDENCE_NOT_FOUND');
assert(
  evidErr.message.toLowerCase().includes('escopo'),
  'EVIDENCE_NOT_FOUND scopes the absence to the analyzed scope'
);
assert(
  !evidErr.message.toLowerCase().includes('não existe'),
  'EVIDENCE_NOT_FOUND does NOT claim global non-existence'
);

// ────────────────────────────────────────────────────────────
// 17. HTTP STATUS MAPPING
// ────────────────────────────────────────────────────────────

section('17. HTTP status mapping');

assert(getHttpStatus('AUTH_REQUIRED') === 401, 'AUTH_REQUIRED → 401');
assert(getHttpStatus('AUTH_FORBIDDEN') === 403, 'AUTH_FORBIDDEN → 403');
assert(getHttpStatus('TENANT_ACCESS_DENIED') === 403, 'TENANT_ACCESS_DENIED → 403');
assert(getHttpStatus('RESOURCE_NOT_FOUND') === 404, 'RESOURCE_NOT_FOUND → 404');
assert(getHttpStatus('INVALID_REQUEST') === 400, 'INVALID_REQUEST → 400');
assert(getHttpStatus('RATE_LIMITED') === 429, 'RATE_LIMITED → 429');
assert(getHttpStatus('PROVIDER_UNAVAILABLE') === 503, 'PROVIDER_UNAVAILABLE → 503');
assert(getHttpStatus('SCAN_TIMEOUT') === 504, 'SCAN_TIMEOUT → 504');
assert(getHttpStatus('INTERNAL_ERROR') === 500, 'INTERNAL_ERROR → 500');

// ────────────────────────────────────────────────────────────
// 18. fromUnknown CONVERSION
// ────────────────────────────────────────────────────────────

section('18. fromUnknown — converts any thrown value into canonical CGAGError');

const fromString = CGAGErrorFactory.fromUnknown('something went wrong');
assert(fromString instanceof CGAGError, 'String converted to CGAGError');

const fromError = CGAGErrorFactory.fromUnknown(new Error('scan analysis failed'));
assert(fromError instanceof CGAGError, 'Error converted to CGAGError');
assert(fromError.code === 'SCAN_FAILED', 'scan error mapped to SCAN_FAILED');

const fromCgag = CGAGErrorFactory.fromUnknown(CGAGErrorFactory.create('AUTH_FORBIDDEN'));
assert(fromCgag.code === 'AUTH_FORBIDDEN', 'CGAGError passed through unchanged');

const fromNull = CGAGErrorFactory.fromUnknown(null);
assert(fromNull instanceof CGAGError, 'null converted to CGAGError (INTERNAL_ERROR)');

const fromTimeout = CGAGErrorFactory.fromUnknown(new Error('Request timed out after 30000ms'));
assert(fromTimeout.code === 'SCAN_TIMEOUT', 'timeout error maps to SCAN_TIMEOUT');

const fromNotFound = CGAGErrorFactory.fromUnknown(new Error('NOT_FOUND: resource xyz'));
assert(fromNotFound.code === 'RESOURCE_NOT_FOUND', 'NOT_FOUND error maps to RESOURCE_NOT_FOUND');

// ────────────────────────────────────────────────────────────
// 19. EXPLICIT SECRET NON-EXPOSURE CHECKS
// ────────────────────────────────────────────────────────────

section('19. Explicit secret non-exposure — OPENROUTER, SILICONFLOW, SUPABASE, JWT, Bearer, password');

const secretSnippets = [
  { label: 'SiliconFlow API key', text: `Error connecting: ${SYNTHETIC_SK_KEY}`, secret: SYNTHETIC_SK_KEY },
  { label: 'OpenRouter API key', text: `Error: ${SYNTHETIC_OR_KEY}`, secret: SYNTHETIC_OR_KEY },
  { label: 'GitHub token', text: `Failed token=${SYNTHETIC_GHP_TOKEN}`, secret: SYNTHETIC_GHP_TOKEN },
  { label: 'Supabase JWT', text: `Auth failed: ${SYNTHETIC_JWT}`, secret: SYNTHETIC_JWT },
  { label: 'Password statement', text: `Config: ${SYNTHETIC_PASS}`, secret: 'SuperSecretPassword123' },
  { label: 'Connection string', text: `DB error: ${SYNTHETIC_CONN_STR}`, secret: 'secret@localhost' },
  { label: 'Unix secrets path', text: `Read error: ${SYNTHETIC_UNIX_PATH}`, secret: 'service-key.json' }
];

// Test each secret snippet against sanitizer output
for (const { label, text, secret } of secretSnippets) {
  const inString = ErrorSanitizer.sanitizeString(text);
  assert(!inString.includes(secret), `${label} not in sanitized string`);
}

// Test secrets against MCP envelope
const errWithSecrets = new Error(`Failed: key=${SYNTHETIC_OR_KEY} jwt=${SYNTHETIC_JWT}`);
const mcpEnv = ErrorSanitizer.toMcpErrorEnvelope(errWithSecrets);
const mcpStr = JSON.stringify(mcpEnv);
for (const secret of [SYNTHETIC_OR_KEY, SYNTHETIC_JWT, 'FAKESIGNATURE']) {
  assert(!mcpStr.includes(secret), `MCP envelope does not contain secret: ${secret.substring(0, 12)}...`);
}

// ────────────────────────────────────────────────────────────
// FINAL REPORT
// ────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(70));
console.log(`CG-AG ERROR HANDLING TEST SUITE`);
console.log('='.repeat(70));
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('='.repeat(70));

if (failed > 0) {
  console.error(`\n>>> ${failed} test(s) FAILED — see above for details <<<\n`);
  process.exit(1);
} else {
  console.log(`\n>>> ALL ${passed} TESTS PASSED — FRIENDLY ERROR SYSTEM VERIFIED <<<\n`);
  process.exit(0);
}
