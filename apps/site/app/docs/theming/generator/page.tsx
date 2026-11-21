// The font picker offers two families the kit no longer ships in tokens/fonts.css; their faces load
// on this page only, for the preview. A generated theme that uses them installs the packages itself.
import '@fontsource-variable/schibsted-grotesk/wght.css';
import '@fontsource-variable/source-serif-4/opsz.css';
import '@fontsource-variable/source-serif-4/opsz-italic.css';
import { DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ThemeGenerator } from '@/components/generator/theme-generator';
import { readSkins, readThemeTemplate } from '@/lib/generator-template';

export const metadata: Metadata = {
  title: 'Theme generator',
  description:
    'Make a rectio theme from a brand colour: every colour derived in OKLCH and corrected until it passes WCAG 2.2 AA, previewed on real screens, installed with the CLI.',
};

/**
 * A static page beside the MDX docs: the default theme's CSS is read from the registry build here,
 * and the generator runs entirely in the browser, so the static export needs no server.
 */
export default function ThemeGeneratorPage() {
  const template = readThemeTemplate();
  const skins = readSkins();
  return (
    <DocsPage full>
      <DocsTitle>Theme generator</DocsTitle>
      <DocsDescription className="mb-0 max-w-prose">
        Pick a brand colour and a few choices; every colour is derived in OKLCH and corrected until
        each pair the kit draws passes WCAG 2.2 AA. Check it on real screens, then install it with
        the CLI or copy the CSS. How themes work is on the{' '}
        <Link href="/docs/theming" className="text-fg underline underline-offset-2">
          theming page
        </Link>
        .
      </DocsDescription>
      <div className="not-prose mt-6">
        <ThemeGenerator template={template.css} skins={skins} />
      </div>
    </DocsPage>
  );
}
