# SaaS admin template

The admin back office of Lindwell, a sample help desk product, as used by the support team of Copperline: an overview with usage figures and a volume chart, a ticket board, customers with a detail page, team and roles, files, notifications, billing and plans, API keys and webhooks, release notes, settings, and the sign-in, sign-up, two-factor and password reset screens. It is a plain Next.js app with a static export, so it deploys to any static host.

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # static site in out/
```

## Where things live

| Path                          | What it holds                                                              |
| ----------------------------- | -------------------------------------------------------------------------- |
| `app/(app)/`                  | The pages inside the app shell, one folder per route                       |
| `app/sign-in/` and the others | The account screens, outside the shell                                     |
| `components/shell/`           | The sidebar, header, command menu, breadcrumb and the shared app state     |
| `components/<page>/`          | Each page's own components, such as `customers/` or `settings/`            |
| `components/auth/auth-api.ts` | Every call the account screens make: wire your auth provider here          |
| `components/states/`          | The loading, empty and error panels every page shares                      |
| `data/`                       | The sample data: workspace, team, customers, tickets, billing and security |

## Wire it to your data

The pages read from `data/` and keep changes in React state, so everything works with no backend. To connect your own:

- **Data:** replace the imports from `data/` with your queries. Each page already has the shapes it needs as types (`Customer`, `Ticket`, `Agent` and so on).
- **Actions:** buttons call plain callbacks (`onInvite`, `onRevoke`, `onSelectPlan`). Send the change to your API inside them.
- **Account screens:** `components/auth/auth-api.ts` holds `signIn`, `signUp`, `verifyCode`, `requestReset` and the rest. Each resolves `{ ok: true }` or `{ ok: false, message }`; the screens already show pending and error states.
- **Saving forms:** `saveProfile` and `saveWorkspace` in the settings pages are the hooks for your API.
- **API key secrets:** generate them on your server. The sample makes one in the browser only so the reveal can be seen.

## Page states

Every data page renders loading, empty and error states. Open them with `?state=loading`, `?state=empty` or `?state=error` in the address, and the workspace settings form with `?state=invalid`. In your app, derive the state from your data fetching and delete `components/use-page-state.ts`.

## Change the theme

The template ships with the rectio default theme in light and dark. People switch the mode with the menu in the header, and their choice is remembered in the browser.

- **Your own colours, type and corners:** every colour, size and radius is a design token in `styles/rectio/`. Edit the theme there, or override the variables in `app/globals.css`.

## Rename the product

The product, workspace and signed-in person are in `data/workspace.ts` (`PRODUCT`, `WORKSPACE`, `CURRENT_USER`). The sign-in quote is in `components/auth/auth-screen.tsx`.

## Deploy under a path

Add `basePath: '/admin'` to `next.config.ts` to serve the app from a sub-path. Every link goes through `next/link` or the router, so links and navigation follow it.

## In the rectio repo

`pnpm shoot` captures the gallery images in `screenshots/` from the static build, headless, and `pnpm walk` opens every page of the build in a headless browser and fails on a console error, a broken request or a link outside the base path. Neither ships with the template.
