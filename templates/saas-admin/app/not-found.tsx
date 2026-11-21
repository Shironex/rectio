import { CompassIcon } from '@phosphor-icons/react/ssr';
import { Anchor, Button, EmptyState } from '@rectio/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Page not found' };

/**
 * A server component: it imports the kit straight from the package root, with no client wrapper,
 * and the build fails if any part of the kit stops being importable on the server.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <EmptyState
        size="lg"
        icon={<CompassIcon aria-hidden weight="duotone" />}
        title="This page does not exist"
        description="The address may be mistyped, or the page has moved. The overview has everything else."
        actions={
          <>
            <Button render={<Anchor href="/" />}>Go to the overview</Button>
            <Button variant="secondary" render={<Anchor href="/tickets" />}>
              Open the tickets
            </Button>
          </>
        }
      />
    </main>
  );
}
