# Agent Profiles Visualizer

## Purpose

[Agent Profiles](https://github.com/guisam/Agent-Profiles) (`@guisam/agent-profiles`)
selects the instructions and skills a coding agent receives. A project's
`.agent-profiles/agents.yaml` maps a **host** (Claude Code, Codex, …), a
**model** (or model **family** fallback) and a **role** (implementer, reviewer,
…) to a **profile** and a set of **skills**. Skills are either required (always
loaded) or available (loaded on demand). Package skills come from a versioned,
locked library. `agent-profiles resolve` produces the context an agent follows.

`agent-profiles visualize` starts a local server with a JSON API and a
hand-written prototype page (`src/visualizer/index.html`, `app.js`, `style.css`
in that repository). This project replaces the prototype page with a Vue +
Vuetify app. The API stays in Agent Profiles. This project only consumes it and
never reads `.agent-profiles/` files directly.

Users are maintainers of projects that use Agent Profiles. They use the
visualizer to:

1. **Explore a resolution.** Choose host, model, family fallback, role and
   optional skills, and see the profile, role and skills the agent would
   receive, with routing provenance, package identities and byte counts. Pin a
   result and compare two resolutions.
2. **Browse and compare skills.** Search and filter the skill library (package
   versions and project-local skills), see which roles use each skill and its
   evidence, and compare two skills file by file or side by side.
3. **Edit the configuration** (only when the server runs with `--edit`). Add,
   remove and move role skills between required and available; add models,
   families and roles; bind a library version; replace a same-name variant for
   one host × model × role after a preview. Every delete or replacement asks
   for confirmation first.

## Status

- First implementation of every screen in `docs/ui-plan.md`: Resolution
  (`src/pages/index.vue`), Skills (`src/pages/skills/index.vue`), Compare
  (`src/pages/skills/compare.vue`) and edit mode. Not yet checked against a
  live server; the dev server runs on recorded fixtures.
- Code layout: API types and client in `src/api/`, Pinia stores per screen
  in `src/stores/`, the shared confirmation dialog in
  `src/composables/useConfirm.ts` and `src/components/ConfirmDialog.vue`.
- Vuetify utility classes are off (`$utilities: false`). Use Tailwind
  utilities, such as `text-on-surface/70` for muted text.
- Routes use hash history: the visualizer server serves only known files
  under its session URL, so path-based deep links would not survive a reload.
- Target: feature parity with the prototype, then improve on it. The
  prototype's behavior and the API are described in `docs/visualize.md` in
  `guisam/Agent-Profiles`. Read it before you build a screen.
- UI plan: `docs/ui-plan.md` maps each prototype feature to Vuetify
  components and sets the build order.
- Blocked for live API calls from the dev server:
  [guisam/Agent-Profiles#124](https://github.com/guisam/Agent-Profiles/issues/124)
  adds `visualize --allow-origin` (see "Agent Profiles API" below).
- End goal: `npx agent-profiles visualize` serves this app's build when
  `@guisam/agent-profiles-visualizer` is installed, so it runs on the API's own
  origin: [guisam/Agent-Profiles#125](https://github.com/guisam/Agent-Profiles/issues/125).
  This side still needs Vite `base: './'`, reading the CSP nonce for Vuetify's
  `cspNonce`, and an npm package.

## Commands

Use pnpm for every project command.

| Task                                  | Command           |
| ------------------------------------- | ----------------- |
| Dev server (port 3000)                | `pnpm dev`        |
| Type-check                            | `pnpm type-check` |
| Production build (type-check + build) | `pnpm build`      |
| Lint and format check                 | `pnpm check`      |
| Apply safe lint and format fixes      | `pnpm check:fix`  |

Before you report work as done, run `pnpm check` and `pnpm build`. Both must pass.

## Stack

- Vue 3 with `<script setup lang="ts">` in every SFC. Write new code in TypeScript.
- Vuetify 4, auto-imported by `vite-plugin-vuetify`. Sass settings are in
  `src/styles/settings.scss`.
- Tailwind CSS 4 through `@tailwindcss/vite`. The theme and utilities are in
  `src/styles/tailwind.css`.
- Vue Router with file-based routes in `src/pages/`, Pinia stores in
  `src/stores/`, and Vue I18n in `src/plugins/i18n.ts`.
- Biome 2 for linting and formatting of TS, Vue (template, script and style),
  CSS, JSON and HTML. The configuration is `biome.json`. Do not add ESLint or
  Prettier.

## UI conventions

- Use a Vuetify component when one exists (tables, dialogs, selects, tooltips,
  chips, expansion panels). Do not build a custom widget for something Vuetify
  provides.
- Use Tailwind utilities for layout and spacing around components. Do not
  restyle Vuetify internals with Tailwind.
- CSS cascade layers are declared in `public/layers.css`. Tailwind utilities
  are above Vuetify components and below `vuetify-final`. Keep custom
  overrides in the `vuetify-overrides` layer (see `src/styles/main.scss`).
- Theme colors come from Vuetify (`--v-theme-*`). Tailwind color tokens map to
  them in `src/styles/tailwind.css`. Do not hard-code colors.
- `src/pages/` file names are route names. Biome's multi-word component name
  rule is off for those files and `src/App.vue` only.

## Vuetify MCP

The hosted Vuetify MCP server (`https://mcp.vuetifyjs.com/mcp`, server name
`vuetify-mcp`) is installed at user scope, not in this repository. Install it
with `npx -y @vuetify/mcp config --remote`. Use it to check component APIs, props and
slots for Vuetify 4 before you write or change component code. Do not rely on
memory of Vuetify 2 or 3 APIs.

## Agent Profiles API

Start the API from a project that uses Agent Profiles:

```powershell
npx --no agent-profiles visualize --port 4790 [--edit]
```

The server prints a session URL `http://127.0.0.1:<port>/<token>/`. Every API
route is under that token prefix. The token changes on each start.

| Route         | Method | Purpose                                                                                                          |
| ------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `api/config`  | GET    | Hosts, models, families, roles, skills. With `--edit` it also returns `editing.revision` and `editing.profiles`. |
| `api/resolve` | GET    | Resolution for `host`, `model`, `family`, `role` and repeated `skill` query parameters.                          |
| `api/skills`  | GET    | Skill library catalog: packages, versions, local skills, role lists, problems. No parameters.                    |
| `api/compare` | GET    | File and side-by-side comparison of two skill selectors (`package:<name>@<version>` or `local:<path>`).          |
| `api/edit`    | POST   | Configuration edits. Available only with `--edit`.                                                               |

The server enforces these rules. Do not try to work around them:

- Without `--edit`, the server accepts only GET.
- `api/edit` requires an `Origin` header that equals the server origin,
  `Content-Type: application/json`, the header `X-Agent-Profiles-Edit: 1`, and
  a body of at most 64 KiB: `{ "revision": "<editing.revision>", "edit": { ... } }`.
- A stale `revision` returns 409. Reload `api/config` and try again.
- The server also checks the `Host` header.

The Vite dev server (`http://localhost:3000`) runs on a different origin than
the API, so the API rejects its requests today. Decided: the API gets an origin
allowlist, `visualize --allow-origin http://localhost:3000`
([#124](https://github.com/guisam/Agent-Profiles/issues/124), not implemented
yet). The app reads the session URL, including the token, from configuration,
not from source code. Do not add a proxy that rewrites `Origin` or `Host`.

The authoritative API description is `docs/visualize.md` in
`guisam/Agent-Profiles`.

### Fixture mode

Until #124 lands, `.env.development` sets `VITE_AP_FIXTURES=true` and the dev
server answers API calls from recorded responses (`src/api/fixtures.ts`).
Each folder in `src/fixtures/` is one recorded project: `default` (the
Agent Profiles repository) and `workflow-skills`. `VITE_AP_FIXTURE_SET` picks
one; set it in `.env.development.local` and restart `pnpm dev`.
Resolutions exist for every configured host, model and family (and none) ×
role × no, each single or all optional skills; comparisons for each pair
within a same-name group on the Skills tab and between project-local skills.
Other requests return an error. Edits are accepted but
change nothing, and replacement previews are refused. To re-record, start
`agent-profiles visualize --edit` and run
`node scripts/capture-fixtures.mjs <session URL> src/fixtures/<set>`.

To use a live server, put `VITE_AP_FIXTURES=false` and
`VITE_AP_SESSION_URL=<session URL>` in `.env.development.local`.
