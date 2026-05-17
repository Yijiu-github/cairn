import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const packageJsonFileName = 'package.json';
const sourceFileExtensions = new Set(['.ts', '.tsx', '.mts', '.cts']);
const ignoredDirectoryNames = new Set([
  '.git',
  '.turbo',
  '.vite',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

const sortDiagnostics = (left, right) =>
  `${left.code}:${left.file}:${left.detail}`.localeCompare(
    `${right.code}:${right.file}:${right.detail}`,
  );

const toPosixPath = (value) => value.split(path.sep).join('/');

const joinRelativePath = (left, right) => toPosixPath(path.join(left, right));

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const collectExportTargets = (exportsField) => {
  if (typeof exportsField === 'string') {
    return [exportsField];
  }

  if (Array.isArray(exportsField)) {
    return exportsField.flatMap((value) => collectExportTargets(value));
  }

  if (!isObject(exportsField)) {
    return [];
  }

  return Object.values(exportsField).flatMap((value) => collectExportTargets(value));
};

const collectExportTargetGroups = (exportsField) => {
  if (typeof exportsField === 'string') {
    return [[exportsField]];
  }

  if (!Array.isArray(exportsField)) {
    return [];
  }

  const targets = exportsField.flatMap((value) => collectExportTargets(value));
  return targets.length > 0 ? [targets] : [];
};

const isExportSubpathKey = (key) => key === '.' || key.startsWith('./');

const formatConditionPath = (conditionPath) => conditionPath.join(' ');

const formatExportTargetDetail = ({ subpath, conditionPath, target }) => {
  const prefix = formatConditionPath(conditionPath);
  return prefix.length > 0 ? `${subpath} ${prefix} -> ${target}` : `${subpath} -> ${target}`;
};

const flattenExportEntries = (exportsField, subpath = '.', conditionPath = []) => {
  const entries = [];
  const targetGroups = collectExportTargetGroups(exportsField);

  if (targetGroups.length > 0) {
    entries.push({ subpath, conditionPath, targetGroups });
    return entries;
  }

  if (!isObject(exportsField)) {
    return entries;
  }

  const objectEntries = Object.entries(exportsField);
  const hasSubpathKeys = objectEntries.some(([key]) => isExportSubpathKey(key));

  if (hasSubpathKeys) {
    for (const [exportSubpath, value] of objectEntries) {
      if (isExportSubpathKey(exportSubpath)) {
        entries.push(...flattenExportEntries(value, exportSubpath, []));
      }
    }

    return entries;
  }

  for (const [condition, value] of objectEntries) {
    entries.push(...flattenExportEntries(value, subpath, [...conditionPath, condition]));
  }

  return entries;
};

const collectExports = (exportsField) => {
  return flattenExportEntries(exportsField, '.');
};

const getExportSubpath = (specifier, packageName) => {
  if (specifier === packageName) {
    return '.';
  }

  return `.${specifier.slice(packageName.length)}`;
};

const isSourceFile = (fileName) => {
  const extension = path.extname(fileName);
  return sourceFileExtensions.has(extension);
};

const readPackageJson = async (filePath) => {
  const text = await readFile(filePath, 'utf8');
  return JSON.parse(text);
};

const walkDirectories = async (rootDirectory, relativeDirectory, packageMap) => {
  const directoryEntries = await readdir(path.join(rootDirectory, relativeDirectory), {
    withFileTypes: true,
  });

  for (const entry of directoryEntries) {
    const relativePath = joinRelativePath(relativeDirectory, entry.name);

    if (entry.isDirectory()) {
      if (ignoredDirectoryNames.has(entry.name)) {
        continue;
      }

      await walkDirectories(rootDirectory, relativePath, packageMap);
      continue;
    }

    if (entry.isFile() && entry.name === packageJsonFileName) {
      const packageJson = await readPackageJson(path.join(rootDirectory, relativePath));
      if (typeof packageJson.name !== 'string' || packageJson.name.length === 0) {
        continue;
      }

      const exportedSubpaths = new Set();
      for (const { subpath } of collectExports(packageJson.exports)) {
        exportedSubpaths.add(subpath);
      }

      const relativePackageDirectory = path.dirname(relativePath);
      packageMap.set(packageJson.name, {
        name: packageJson.name,
        relativeDirectory: toPosixPath(relativePackageDirectory),
        exportedSubpaths,
      });
    }
  }
};

const extractImportSpecifiers = (sourceText) => {
  const specifiers = [];
  const importRegex = /\bimport\s+(?:type\s+)?(?:[^'"`]*?\s+from\s+)?(['"])([^'"`]+)\1/g;
  const exportRegex = /\bexport\s+(?:type\s+)?(?:[^'"`]*?\s+from\s+)?(['"])([^'"`]+)\1/g;
  const dynamicImportRegex = /\bimport\s*\(\s*(['"])([^'"`]+)\1\s*\)/g;

  for (const regex of [importRegex, exportRegex, dynamicImportRegex]) {
    let match = regex.exec(sourceText);
    while (match) {
      specifiers.push(match[2]);
      match = regex.exec(sourceText);
    }
  }

  return specifiers;
};

const getWorkspacePackageForFile = (relativeFilePath, packageByName) => {
  const normalizedFilePath = toPosixPath(relativeFilePath);
  for (const workspacePackage of packageByName.values()) {
    const packageRoot = `${workspacePackage.relativeDirectory}/`;
    if (
      normalizedFilePath === workspacePackage.relativeDirectory ||
      normalizedFilePath.startsWith(packageRoot)
    ) {
      return workspacePackage;
    }
  }

  return null;
};

const resolveImportPackageName = (specifier) => {
  if (!specifier.startsWith('@cairn/')) {
    return null;
  }

  const withoutScope = specifier.slice('@cairn/'.length);
  const [packagePart] = withoutScope.split('/');
  return `@cairn/${packagePart}`;
};

const isInternalImport = (specifier) => {
  return specifier.includes('/internal/');
};

const resolveRelativeImportPath = (relativeFilePath, specifier) => {
  if (!specifier.startsWith('.')) {
    return null;
  }

  return toPosixPath(path.normalize(path.join(path.dirname(relativeFilePath), specifier)));
};

const isCrossPackageRelativeImport = ({ relativeFilePath, specifier, packageByName }) => {
  if (specifier.startsWith('.') && specifier.includes('/packages/')) {
    return true;
  }

  const resolvedImportPath = resolveRelativeImportPath(relativeFilePath, specifier);
  if (!resolvedImportPath) {
    return false;
  }

  const owningPackage = getWorkspacePackageForFile(relativeFilePath, packageByName);
  const importedPackage = getWorkspacePackageForFile(resolvedImportPath, packageByName);

  return isCrossPackageImport(owningPackage, importedPackage);
};

const isAllowedExportedSubpath = (specifier, workspacePackage) => {
  const subpath = getExportSubpath(specifier, workspacePackage.name);
  return workspacePackage.exportedSubpaths.has(subpath);
};

const allowedDependencyTargetsByPackage = new Map([
  [
    '@cairn/application',
    new Set(['@cairn/domain', '@cairn/shared-contracts', '@cairn/runtime-gateway']),
  ],
  ['@cairn/storage', new Set(['@cairn/domain', '@cairn/shared-contracts'])],
  ['@cairn/runtime-gateway', new Set(['@cairn/shared-contracts'])],
  ['@cairn/domain', new Set()],
  ['@cairn/shared-contracts', new Set()],
  ['@cairn/ui', new Set(['@cairn/shared-contracts'])],
  [
    '@cairn/workspace-core',
    new Set([
      '@cairn/application',
      '@cairn/storage',
      '@cairn/runtime-gateway',
      '@cairn/shared-contracts',
      '@cairn/domain',
    ]),
  ],
  ['@cairn/ui-preview', new Set(['@cairn/ui'])],
  ['@cairn/desktop', new Set(['@cairn/shared-contracts', '@cairn/ui'])],
]);

const canImportPackage = (owningPackage, importedPackage) => {
  if (!owningPackage || !importedPackage || owningPackage.name === importedPackage.name) {
    return true;
  }

  const allowedTargets = allowedDependencyTargetsByPackage.get(owningPackage.name);
  if (!allowedTargets) {
    return false;
  }

  return allowedTargets.has(importedPackage.name);
};

const isCrossPackageImport = (fromPackage, toPackage) => {
  return Boolean(fromPackage && toPackage && fromPackage.name !== toPackage.name);
};

const packageToPackageImport = (specifier, packageByName) => {
  const importedPackageName = resolveImportPackageName(specifier);
  if (!importedPackageName) {
    return null;
  }

  const importedPackage = packageByName.get(importedPackageName);
  if (!importedPackage) {
    return null;
  }

  return { importedPackageName, importedPackage };
};

export const discoverWorkspacePackages = async (rootDirectory) => {
  const packageMap = new Map();

  const queue = ['apps', 'packages'];
  for (const topLevelDirectory of queue) {
    const absoluteDirectory = path.join(rootDirectory, topLevelDirectory);
    let directoryStat;
    try {
      directoryStat = await stat(absoluteDirectory);
    } catch {
      continue;
    }

    if (!directoryStat.isDirectory()) {
      continue;
    }

    await walkDirectories(rootDirectory, topLevelDirectory, packageMap);
  }

  return packageMap;
};

export const checkSourceFile = ({ relativeFilePath, sourceText, packageByName }) => {
  const diagnostics = [];
  const normalizedFilePath = toPosixPath(relativeFilePath);
  const owningPackage = getWorkspacePackageForFile(normalizedFilePath, packageByName);

  for (const specifier of extractImportSpecifiers(sourceText)) {
    if (
      isCrossPackageRelativeImport({
        relativeFilePath: normalizedFilePath,
        specifier,
        packageByName,
      })
    ) {
      diagnostics.push({
        code: 'cross_package_relative_import',
        file: normalizedFilePath,
        message: 'Use @cairn/* package exports instead of relative imports into packages/.',
        detail: specifier,
      });
      continue;
    }

    const importedPackageInfo = packageToPackageImport(specifier, packageByName);
    if (importedPackageInfo) {
      const { importedPackage } = importedPackageInfo;
      if (isInternalImport(specifier)) {
        diagnostics.push({
          code: 'cross_package_internal_import',
          file: normalizedFilePath,
          message: 'Do not import another package internal implementation.',
          detail: specifier,
        });
        continue;
      }

      if (!isAllowedExportedSubpath(specifier, importedPackage)) {
        diagnostics.push({
          code: 'non_exported_package_subpath',
          file: normalizedFilePath,
          message: `Import ${importedPackage.name} through package.json exports.`,
          detail: specifier,
        });
        continue;
      }

      if (
        owningPackage &&
        isCrossPackageImport(owningPackage, importedPackage) &&
        !canImportPackage(owningPackage, importedPackage)
      ) {
        diagnostics.push({
          code: 'module_boundary_violation',
          file: normalizedFilePath,
          message: `${owningPackage.relativeDirectory} must not import ${importedPackage.name}.`,
          detail: specifier,
        });
      }
    }
  }

  return diagnostics;
};

export const checkPackagePublicApi = async (rootDirectory, workspacePackage) => {
  const diagnostics = [];
  const packageJsonPath = path.join(
    rootDirectory,
    workspacePackage.relativeDirectory,
    packageJsonFileName,
  );
  let packageJson;

  try {
    packageJson = await readPackageJson(packageJsonPath);
  } catch {
    return diagnostics;
  }

  for (const { subpath, conditionPath, targetGroups } of collectExports(packageJson.exports)) {
    if (targetGroups.length === 0) {
      continue;
    }

    for (const targets of targetGroups) {
      let targetExists = false;

      for (const target of targets) {
        const targetPath = target.startsWith('./') ? target.slice(2) : target;
        if (targetPath.length === 0) {
          continue;
        }

        const resolvedTargetPath = path.join(
          rootDirectory,
          workspacePackage.relativeDirectory,
          targetPath,
        );
        try {
          const targetStat = await stat(resolvedTargetPath);
          if (targetStat.isFile()) {
            targetExists = true;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!targetExists) {
        diagnostics.push({
          code: 'missing_public_export_target',
          file: path.join(workspacePackage.relativeDirectory, packageJsonFileName),
          message: 'package.json exports points to a missing source file.',
          detail: formatExportTargetDetail({
            subpath,
            conditionPath,
            target: targets[0],
          }),
        });
      }
    }
  }

  return diagnostics;
};

export const formatDiagnostics = (diagnostics) => {
  if (diagnostics.length === 0) {
    return 'standards:check passed with 0 violation(s).';
  }

  const lines = [`standards:check found ${diagnostics.length} violation(s):`, ''];

  for (const diagnostic of [...diagnostics].sort(sortDiagnostics)) {
    lines.push(diagnostic.code);
    lines.push(`  file: ${diagnostic.file}`);
    lines.push(`  rule: ${diagnostic.message}`);
    lines.push(`  detail: ${diagnostic.detail}`);
    lines.push('');
  }

  return lines.join('\n');
};

export const runStandardsCheck = async (rootDirectory) => {
  const packageByName = await discoverWorkspacePackages(rootDirectory);
  const diagnostics = [];

  const visitDirectory = async (relativeDirectory) => {
    let directoryEntries;
    try {
      directoryEntries = await readdir(path.join(rootDirectory, relativeDirectory), {
        withFileTypes: true,
      });
    } catch {
      return;
    }

    for (const entry of directoryEntries) {
      const relativePath = joinRelativePath(relativeDirectory, entry.name);

      if (entry.isDirectory()) {
        if (ignoredDirectoryNames.has(entry.name)) {
          continue;
        }

        await visitDirectory(relativePath);
        continue;
      }

      if (!entry.isFile() || entry.name === packageJsonFileName || !isSourceFile(entry.name)) {
        continue;
      }

      const sourceText = await readFile(path.join(rootDirectory, relativePath), 'utf8');
      diagnostics.push(
        ...checkSourceFile({ relativeFilePath: relativePath, sourceText, packageByName }),
      );
    }
  };

  await Promise.all(['apps', 'packages'].map(async (directory) => visitDirectory(directory)));

  for (const workspacePackage of packageByName.values()) {
    diagnostics.push(...(await checkPackagePublicApi(rootDirectory, workspacePackage)));
  }

  return diagnostics.sort(sortDiagnostics);
};

export const main = async () => {
  const rootDirectory = process.cwd();
  const diagnostics = await runStandardsCheck(rootDirectory);
  const output = formatDiagnostics(diagnostics);

  if (diagnostics.length === 0) {
    process.stdout.write(`${output}\n`);
    return 0;
  }

  process.stderr.write(`${output}\n`);
  return 1;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const exitCode = await main();
  process.exitCode = exitCode;
}
