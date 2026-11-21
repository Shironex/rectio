import type { RegistryItem } from '@rectio/registry';

import { countDependencies } from '../core/install.ts';
import type { InstallReport, PlannedFile } from '../core/installer.ts';
import type { PackageManager } from '../core/project.ts';
import { keyValues, plural, wrap } from './layout.ts';
import type { Ui } from './output.ts';
import { pad, type Styles } from './style.ts';

/** Summary rows: `[key, value]`, where an empty key continues the row above. */
export type Rows = [string, string][];

const written = (files: readonly PlannedFile[]) =>
  files.filter((f) => f.action === 'create' || f.action === 'update');

/** `src/components/ui  4 files` rows, one per folder that got files. */
export function folderLines(files: readonly PlannedFile[], s: Styles): string[] {
  const counts = new Map<string, number>();
  for (const file of written(files)) {
    const folder = file.path.includes('/') ? file.path.slice(0, file.path.lastIndexOf('/')) : '.';
    counts.set(folder, (counts.get(folder) ?? 0) + 1);
  }
  const width = Math.max(0, ...[...counts.keys()].map((k) => k.length));
  return [...counts.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([folder, count]) => `${pad(folder, width)}  ${s.dim(plural(count, 'file'))}`);
}

/** Items by kind, motion twins apart: `41 components`, `12 blocks`, `30 motion twins`. */
export function kindCounts(items: readonly RegistryItem[]): string[] {
  const order: [string, string][] = [
    ['component', 'component'],
    ['block', 'block'],
    ['motion', 'motion twin'],
    ['theme', 'theme'],
    ['skin', 'skin'],
    ['lib', 'lib'],
    ['hook', 'hook'],
    ['style', 'style'],
  ];
  const counts = new Map<string, number>();
  for (const item of items) {
    const kind = item.name.startsWith('motion-') ? 'motion' : item.type;
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  return order
    .filter(([kind]) => (counts.get(kind) ?? 0) > 0)
    .map(([kind, label]) => plural(counts.get(kind) ?? 0, label));
}

/** The `dev` script through a manager: `pnpm dev`, `npm run dev`. */
export const devCommand = (manager: PackageManager): string =>
  manager === 'npm' || manager === 'bun' ? `${manager} run dev` : `${manager} dev`;

/** The rows every install shares: files by folder and the packages. */
export function installRows(
  report: InstallReport,
  s: Styles,
  options: { manager: PackageManager },
): Rows {
  const rows: Rows = [];
  const folders = folderLines(report.files, s);
  const unchanged = report.files.filter((f) => f.action === 'unchanged').length;
  for (const [i, line] of folders.entries()) rows.push([i === 0 ? 'Files' : '', line]);
  if (unchanged > 0) {
    rows.push([
      folders.length === 0 ? 'Files' : '',
      s.dim(`${plural(unchanged, 'file')} already up to date`),
    ]);
  }
  const packages = Object.keys({ ...report.added.dependencies, ...report.added.devDependencies });
  if (packages.length > 0) {
    const how = report.dryRun
      ? 'would be added to package.json'
      : report.manager !== undefined
        ? `installed with ${report.manager}`
        : `added to package.json, run \`${options.manager} install\``;
    for (const [i, line] of wrap(packages, 60).entries())
      rows.push([i === 0 ? 'Packages' : '', line]);
    rows.push(['', s.dim(how)]);
  }
  return rows;
}

/** Rows as box lines: aligned keys, dim. */
export const rowLines = (rows: Rows, s: Styles): string[] => keyValues(rows, s);

/** `--verbose`: every item, every file and every package, in sections. */
export function printVerbose(ui: Ui, report: InstallReport): void {
  if (!ui.verbose) return;
  const { s } = ui;
  const asked = new Set(report.requested);
  const width = Math.max(...report.items.map((i) => i.name.length));
  ui.line();
  ui.rule(`Items (${String(report.items.length)})`);
  for (const item of report.items) {
    const why = asked.has(item.name) ? 'asked' : 'dependency';
    ui.line(`${pad(item.name, width)}  ${s.dim(pad(item.version, 8))} ${s.dim(why)}`);
  }
  ui.line();
  ui.rule(`Files (${String(report.files.length)})`);
  const marks = { create: '+', update: '~', unchanged: '=', conflict: '!' } as const;
  for (const file of report.files) {
    const line = `${marks[file.action]} ${file.path}`;
    ui.line(file.action === 'unchanged' ? s.dim(line) : line);
  }
  const deps = { ...report.added.dependencies, ...report.added.devDependencies };
  if (countDependencies(report.added) > 0) {
    ui.line();
    ui.rule(`Packages (${String(countDependencies(report.added))})`);
    for (const [name, range] of Object.entries(deps)) ui.line(`${name}  ${s.dim(range)}`);
  }
}

/** A dim `Tip:` paragraph, wrapped so it never widens the box past a normal terminal. */
export const tipParagraph = (text: string, s: Styles, width = 64): string[] =>
  wrap(`Tip: ${text}`.split(' '), width, ' ').map((line) => s.dim(line));

/** Notes of the items that were asked for, such as how to switch to a theme. */
export function tipLines(report: InstallReport, s: Styles): string[] {
  const asked = new Set(report.requested);
  return report.items
    .filter((item) => asked.has(item.name))
    .flatMap((item) => (item.docs === undefined ? [] : tipParagraph(item.docs, s)));
}

/** One warning per installed item that is going away, with what to use instead. */
export function deprecationWarnings(report: InstallReport): string[] {
  return report.items.flatMap((item) =>
    item.deprecated === undefined ? [] : [`${item.name} is deprecated. ${item.deprecated}`],
  );
}
