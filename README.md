# @guisam/agent-profiles-visualizer

An interactive front end for
[Agent Profiles](https://github.com/guisam/Agent-Profiles)
(`@guisam/agent-profiles`). It replaces the built-in page of
`agent-profiles visualize` with a Vue + Vuetify app:

- **Resolution:** choose host, model, family, role and optional skills, and see
  the profile and skills an agent would receive, with routing provenance,
  package identities and byte counts. Pin a result and compare two.
- **Skills:** search and filter the skill library and see which roles use each
  skill.
- **Compare:** compare two skills file by file or side by side.
- **Edit mode** (`visualize --edit`): change role skills, add models, families
  and roles, and bind or replace skill versions, with a confirmation before
  every delete or replacement.

## Use

Install it next to Agent Profiles in a project:

```sh
npm i -D @guisam/agent-profiles @guisam/agent-profiles-visualizer
npx agent-profiles visualize --edit
```

From `@guisam/agent-profiles` 0.31.0, `visualize` serves this app when the
package is installed and prints its version at startup. `--ui builtin` serves
the built-in page instead. See
[Use the visualizer app](https://github.com/guisam/Agent-Profiles/blob/main/docs/visualize.md#use-the-visualizer-app)
for what is served and the content security policy.

The package contains only the built app in `dist/`. It has no runtime
dependencies and reads the configuration only through the `visualize` API.

## Develop

See [AGENTS.md](https://github.com/guisam/agent-profiles-visualizer/blob/main/AGENTS.md) for the stack, commands, fixture mode and API
rules. In short: `pnpm install`, `pnpm dev`, and before a commit
`pnpm check` and `pnpm build`.

## License

Apache-2.0
