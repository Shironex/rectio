import { highlight } from '@/lib/highlight';

import type { CodeTabsProps, EndpointProps, SignatureCardProps } from '@rectio/blocks/docs';

import { CodeBlock, CodeTabs, Endpoint, SignatureCard } from './blocks';

/** A Markdown code fence, highlighted at build time. The MDX pipeline renders fences as this. */
export async function Code({ code, lang, meta }: { code: string; lang?: string; meta?: string }) {
  const tokens = await highlight(code, lang);
  return (
    <CodeBlock
      code={code.replace(/\n$/, '')}
      lang={lang}
      meta={meta}
      {...(tokens === null ? {} : { tokens })}
    />
  );
}

/** Code tabs whose examples are highlighted at build time, like the fences. */
export async function HighlightedCodeTabs({ items, ...props }: CodeTabsProps) {
  const highlighted = await Promise.all(
    items.map(async (item) => {
      if (item.code === undefined || item.tokens !== undefined) return item;
      const tokens = await highlight(item.code, item.lang);
      return tokens === null ? item : { ...item, tokens };
    }),
  );
  return <CodeTabs items={highlighted} {...props} />;
}

/** A signature card whose signature is highlighted at build time. */
export async function HighlightedSignatureCard(props: SignatureCardProps) {
  const tokens = props.tokens ?? (await highlight(props.signature, 'ts'));
  return <SignatureCard {...props} {...(tokens === null ? {} : { tokens })} />;
}

/** JSON as written in a page, indented two spaces; MDX drops the indentation of JSX attributes. */
function prettyJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

/** An endpoint whose request and response examples are highlighted at build time. */
export async function HighlightedEndpoint({ request, responses, ...props }: EndpointProps) {
  const requestTokens =
    request === undefined ? null : await highlight(request.code, request.lang ?? 'bash');
  const highlighted =
    responses === undefined
      ? undefined
      : await Promise.all(
          responses.map(async (response) => {
            if (response.example === undefined || response.tokens !== undefined) return response;
            const lang = response.lang ?? 'json';
            const example = lang === 'json' ? prettyJson(response.example) : response.example;
            const tokens = await highlight(example, lang);
            return tokens === null ? { ...response, example } : { ...response, example, tokens };
          }),
        );
  return (
    <Endpoint
      {...props}
      {...(request === undefined
        ? {}
        : { request: requestTokens === null ? request : { ...request, tokens: requestTokens } })}
      {...(highlighted === undefined ? {} : { responses: highlighted })}
    />
  );
}
