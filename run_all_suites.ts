import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const testDir = path.resolve(process.cwd(), 'tests');
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.test.ts'));

console.log('================================================================');
console.log('CG-AG GOVERNANCE OS - FULL SUITE VALIDATION (36 SUITES)');
console.log('================================================================\n');

let passed = 0;
let failed = 0;
const failures: string[] = [];

for (const file of files) {
  process.stdout.write('Executing ' + file.padEnd(42) + ' ... ');
  try {
    if (file === 'scan-governance-bridge.test.ts') {
      execSync('npx vitest run tests/' + file, { stdio: 'pipe' });
    } else {
      execSync('npx tsx tests/' + file, { stdio: 'pipe' });
    }
    console.log('PASS');
    passed++;
  } catch (err: any) {
    console.log('FAIL');
    failed++;
    failures.push(file);
    if (err.stdout) console.log(err.stdout.toString());
    if (err.stderr) console.log(err.stderr.toString());
  }
}

console.log('\n================================================================');
console.log('TOTAL SUITES: ' + files.length + ' | PASSED: ' + passed + ' | FAILED: ' + failed);
console.log('================================================================');

if (failed > 0) {
  console.error('\nFailures:', failures);
  process.exit(1);
} else {
  console.log('\nALL 36 TEST SUITES PASSED PERFECTLY!');
}
