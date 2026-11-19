/** The routes a template ships, as a compact grid instead of one tall list. */
export function TemplatePages({ routes }: { routes: string[] }) {
  return (
    <ul className="not-prose my-6 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
      {routes.map((route) => (
        <li key={route} className="min-w-0 truncate font-mono text-sm text-fg-muted" title={route}>
          {route}
        </li>
      ))}
    </ul>
  );
}
