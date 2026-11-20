/**
 * How the CLI was started, so every command it prints for the user to run works as typed: a user
 * who ran `pnpm dlx @rectio/cli init` has no `rectio` binary on PATH. The update notice keeps its
 * own wording (it adds @latest and suggests global upgrades); this is for everything else.
 */
export type Runner = 'pnpm-dlx' | 'npx' | 'bunx' | 'yarn-dlx' | 'installed';

const PACKAGE = '@rectio/cli';

const PREFIX: Record<Runner, string> = {
  'pnpm-dlx': `pnpm dlx ${PACKAGE}`,
  npx: `npx ${PACKAGE}`,
  bunx: `bunx ${PACKAGE}`,
  'yarn-dlx': `yarn dlx ${PACKAGE}`,
  installed: 'rectio',
};

/**
 * From the running script's path and npm_config_user_agent. pnpm dlx keeps packages under a `dlx`
 * folder of its cache, npx under `_npx`, bunx under a `bunx-<uid>-<package>` temp folder, and yarn
 * dlx under a `dlx-<id>` temp folder. Anything else (a global or project install) is `rectio`.
 */
export function detectRunner(
  scriptPath: string,
  env: Readonly<Record<string, string | undefined>>,
): Runner {
  const path = scriptPath.replaceAll('\\', '/');
  const agent = env.npm_config_user_agent?.trim().toLowerCase() ?? '';
  if (path.includes('/_npx/')) return 'npx';
  if (path.includes('/dlx/')) return 'pnpm-dlx';
  if (/\/bunx-[^/]*\//.test(path)) return 'bunx';
  if (agent.startsWith('yarn/') && /\/dlx-[^/]*\//.test(path)) return 'yarn-dlx';
  return 'installed';
}

let current: Runner = 'installed';

/** Set once per run by main; tests set it directly. */
export function setRunner(runner: Runner): void {
  current = runner;
}

export const getRunner = (): Runner => current;

/** `add <item>` as the user should type it: `rectio add <item>` or `pnpm dlx @rectio/cli add <item>`. */
export function cliCommand(args: string): string {
  return args === '' ? PREFIX[current] : `${PREFIX[current]} ${args}`;
}
