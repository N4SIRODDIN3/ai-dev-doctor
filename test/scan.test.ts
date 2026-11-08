import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { scanRepository } from '../src/scanner.js';

const fixture = (name: string) => path.resolve('test-fixtures', name);
const secretFixturePath = path.join(fixture('unhealthy'), '.env');

afterEach(() => rmSync(secretFixturePath, { force: true }));

describe('scanRepository', () => {
  it('reports a healthy repository with no findings', () => {
    expect(scanRepository(fixture('healthy'))).toEqual([]);
  });

  it('reports actionable findings for missing project hygiene and secret-like files', () => {
    writeFileSync(secretFixturePath, 'DATABASE_URL=not-a-real-secret');
    const findings = scanRepository(fixture('unhealthy'));
    expect(findings.map((finding) => finding.id)).toEqual([
      'missing-readme',
      'missing-license',
      'missing-gitignore',
      'missing-package-manifest',
      'missing-contributing',
      'secret-like-file',
    ]);
    expect(findings.find((finding) => finding.id === 'secret-like-file')?.message).toContain('.env');
    expect(JSON.stringify(findings)).not.toContain('not-a-real-secret');
  });

  it('checks gitignore protections and package test and lint scripts', () => {
    expect(scanRepository(fixture('incomplete-package')).map((finding) => finding.id)).toEqual([
      'gitignore-missing-node-modules',
      'gitignore-missing-env',
      'missing-test-script',
      'missing-lint-script',
    ]);
  });

  it('skips symlinked directories so secret scans stay inside the target and do not cycle', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'ai-dev-doctor-'));
    const outside = mkdtempSync(path.join(os.tmpdir(), 'ai-dev-doctor-outside-'));
    mkdirSync(path.join(root, 'nested'));
    writeFileSync(path.join(outside, '.env'), 'OUTSIDE_SECRET=not-a-real-secret');
    symlinkSync(outside, path.join(root, 'outside-link'), 'junction');
    symlinkSync(root, path.join(root, 'nested', 'cycle'), 'junction');

    try {
      const findings = scanRepository(root);
      expect(findings.filter((finding) => finding.id === 'secret-like-file')).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });
});
