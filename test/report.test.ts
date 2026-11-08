import { describe, expect, it } from 'vitest';
import { renderReport } from '../src/report.js';

const finding = {
  id: 'missing-readme',
  severity: 'warning' as const,
  message: 'README.md is missing.',
  recommendation: 'Add a README.md.',
};

describe('renderReport', () => {
  it('renders findings as JSON when requested', () => {
    expect(renderReport([finding], true)).toBe(JSON.stringify([finding], null, 2));
  });

  it('renders a readable success report when no findings exist', () => {
    expect(renderReport([], false)).toBe('AI Dev Doctor: no findings — repository basics look healthy.');
  });
});
