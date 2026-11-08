import { rmSync, writeFileSync } from 'node:fs';
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
});
