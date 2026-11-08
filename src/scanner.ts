import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export type Finding = {
  id: string;
  severity: 'warning';
  message: string;
  recommendation: string;
};

const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', 'coverage']);

function hasFile(repositoryPath: string, name: string): boolean {
  return existsSync(path.join(repositoryPath, name));
}

function findSecretLikeFiles(repositoryPath: string, relativePath = ''): string[] {
  const directory = path.join(repositoryPath, relativePath);
  const matches: string[] = [];

  for (const entry of readdirSync(directory)) {
    const entryPath = path.join(directory, entry);
    const entryRelativePath = path.join(relativePath, entry);
    const stats = lstatSync(entryPath);

    if (stats.isSymbolicLink()) continue;

    if (stats.isDirectory()) {
      if (!ignoredDirectories.has(entry)) matches.push(...findSecretLikeFiles(repositoryPath, entryRelativePath));
      continue;
    }

    const isSecretLike =
      (entry === '.env' || (entry.startsWith('.env.') && entry !== '.env.example')) ||
      entry === 'id_rsa' ||
      entry.endsWith('.pem') ||
      entry.endsWith('.key') ||
      entry.startsWith('credentials');
    if (isSecretLike) matches.push(entryRelativePath);
  }

  return matches;
}

export function scanRepository(targetPath: string): Finding[] {
  const repositoryPath = path.resolve(targetPath);
  if (!existsSync(repositoryPath)) throw new Error(`Target path does not exist: ${repositoryPath}`);

  const findings: Finding[] = [];
  if (!hasFile(repositoryPath, 'README.md')) {
    findings.push({ id: 'missing-readme', severity: 'warning', message: 'README.md is missing.', recommendation: 'Add setup, usage, and project purpose documentation.' });
  }
  if (!hasFile(repositoryPath, 'LICENSE')) {
    findings.push({ id: 'missing-license', severity: 'warning', message: 'LICENSE is missing.', recommendation: 'Add a license so reuse terms are clear.' });
  }

  const gitignorePath = path.join(repositoryPath, '.gitignore');
  if (!existsSync(gitignorePath)) {
    findings.push({ id: 'missing-gitignore', severity: 'warning', message: '.gitignore is missing.', recommendation: 'Add .gitignore protections for dependencies, build output, and environment files.' });
  } else {
    const gitignore = readFileSync(gitignorePath, 'utf8');
    if (!/^\/?node_modules\/?$/m.test(gitignore)) {
      findings.push({ id: 'gitignore-missing-node-modules', severity: 'warning', message: '.gitignore does not protect node_modules.', recommendation: 'Add node_modules/ to .gitignore.' });
    }
    if (!/^\/?\.env(?:\*|\s*$)/m.test(gitignore)) {
      findings.push({ id: 'gitignore-missing-env', severity: 'warning', message: '.gitignore does not protect .env files.', recommendation: 'Add .env or .env.* to .gitignore.' });
    }
  }

  const packagePath = path.join(repositoryPath, 'package.json');
  if (!existsSync(packagePath)) {
    findings.push({ id: 'missing-package-manifest', severity: 'warning', message: 'package.json is missing.', recommendation: 'Add a package manifest to define the project and its scripts.' });
  } else {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as { scripts?: Record<string, string> };
    if (!packageJson.scripts?.test) {
      findings.push({ id: 'missing-test-script', severity: 'warning', message: 'package.json has no test script.', recommendation: 'Add an npm test script for automated checks.' });
    }
    if (!packageJson.scripts?.lint) {
      findings.push({ id: 'missing-lint-script', severity: 'warning', message: 'package.json has no lint script.', recommendation: 'Add an npm lint script for static checks.' });
    }
  }

  if (!hasFile(repositoryPath, 'CONTRIBUTING.md')) {
    findings.push({ id: 'missing-contributing', severity: 'warning', message: 'CONTRIBUTING.md is missing.', recommendation: 'Add contribution guidance for collaborators.' });
  }

  for (const secretPath of findSecretLikeFiles(repositoryPath)) {
    findings.push({ id: 'secret-like-file', severity: 'warning', message: `Secret-like file detected: ${secretPath}. Contents were not read.`, recommendation: 'Remove it from version control, rotate exposed credentials, and use a safe local secret store.' });
  }

  return findings;
}
