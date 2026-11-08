#!/usr/bin/env node
import { scanRepository } from './scanner.js';
import { renderReport } from './report.js';

const args = process.argv.slice(2);
const json = args.includes('--json');
const targetPath = args.find((argument) => !argument.startsWith('-')) ?? process.cwd();

try {
  console.log(renderReport(scanRepository(targetPath), json));
} catch (error) {
  console.error(`AI Dev Doctor failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
