import { AUTH_BLOCKS, SAAS_BLOCK_NAMES, SAAS_DEMOS, type SaasBlockName } from './index';

/**
 * The SaaS blocks in the playground: `?view=blocks&block=<name>` shows one block, and
 * `?view=blocks&set=saas` shows them all, auth forms first, then the app blocks in a column.
 */
export type SaasSelection = SaasBlockName | 'all';

export function saasBlockFrom(search: string): SaasSelection | null {
  const params = new URLSearchParams(search);
  if (params.get('set') === 'saas') return 'all';
  const block = params.get('block');
  return SAAS_BLOCK_NAMES.find((name) => name === block) ?? null;
}

interface Props {
  selection: SaasSelection;
  motion: boolean;
  empty: boolean;
  locale: 'en-GB';
}

function One({ name, ...props }: Omit<Props, 'selection'> & { name: SaasBlockName }) {
  const Demo = SAAS_DEMOS[name];
  return <Demo {...props} />;
}

export function SaasPage({ selection, ...props }: Props) {
  if (selection !== 'all') {
    return (
      <main
        className={
          AUTH_BLOCKS.has(selection)
            ? 'flex min-h-dvh items-start justify-center px-4 py-12 sm:py-20'
            : 'mx-auto max-w-5xl px-4 py-8 sm:px-8'
        }
      >
        <One name={selection} {...props} />
      </main>
    );
  }
  const auth = SAAS_BLOCK_NAMES.filter((name) => AUTH_BLOCKS.has(name));
  const app = SAAS_BLOCK_NAMES.filter((name) => !AUTH_BLOCKS.has(name));
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-fg-muted">Fernhill workspace</p>
        <h1 className="font-display text-3xl font-heading tracking-tight">SaaS blocks</h1>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {auth.map((name) => (
          <One key={name} name={name} {...props} />
        ))}
      </div>
      <div className="flex flex-col gap-6">
        {app.map((name) => (
          <One key={name} name={name} {...props} />
        ))}
      </div>
    </div>
  );
}
