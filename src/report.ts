import type { Finding } from './scanner.js';

export function renderReport(findings: Finding[], json: boolean): string {
  if (json) return JSON.stringify(findings, null, 2);
  if (findings.length === 0) return 'AI Dev Doctor: no findings — repository basics look healthy.';

  return [
    `AI Dev Doctor: ${findings.length} finding${findings.length === 1 ? '' : 's'}`,
    ...findings.map((finding) => `- [${finding.severity}] ${finding.message}\n  Fix: ${finding.recommendation}`),
  ].join('\n');
}
