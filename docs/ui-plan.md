# UI plan

How the Vue + Vuetify app replaces the Agent Profiles prototype visualizer
(`src/visualizer/` in `guisam/Agent-Profiles`). The behavior to match is in
`docs/visualize.md` in that repository. This plan says which Vuetify 4
components to use for each part. Check component APIs with the Vuetify MCP
before you build a screen.

## 1. Page layout

The prototype is one long page. Split it into routes, with `v-tabs` in the
`extension` slot of `v-app-bar`:

| Tab        | Route             | Contents                                          |
| ---------- | ----------------- | ------------------------------------------------- |
| Resolution | `/`               | Selectors, totals, composition, pinned comparison |
| Skills     | `/skills`         | Skill library table                               |
| Compare    | `/skills/compare` | Skill-vs-skill file comparison                    |

Controls that apply to every page go on the right side of the app bar:

- **Refresh files**: an icon button with a tooltip.
- **Mode chip**: `Read only`, or `Edits on` in a warning color when the server
  runs with `--edit`.
- **Loading bar**: the app bar's `loading` prop during any API call.
- **Theme menu**: system, light, dark (done).

## 2. Resolution page

**Selectors** (Host, Model, Family fallback, Role) are `v-select` fields. The
prototype's hover text on each label becomes an info icon with a `v-tooltip`,
or a `hint` under the field. On wide screens they sit in a toolbar row. On
phones they move into a `v-navigation-drawer`.

**Totals** are three `v-card`s: managed instruction context (the main one),
available but not injected, and host / bench context. The last one shows an
`Unobserved` chip, never 0. Unknown is never displayed as zero.

**Composition:**

- Profile and role layers are `v-expansion-panels`. Each panel title shows the
  entry ID and a byte-count chip. The body shows the path or package identity
  (`v-code` with a copy button), bytes and characters, why the entry is
  included, and the instruction text in a scrollable monospace `v-sheet`.
  Dependency and workflow companion entries use the same panels.
- **Required skills** is a `v-list` with the same expandable details.
- **On demand** is a `v-list` with a `v-checkbox` per skill. Host-native skills
  get a `host skill` chip with their host skill ID and verification state, no
  checkbox and no byte count.
- In edit mode, each skill row gets a menu (`v-menu`) with **Move to
  required** or **Move to on demand**, and **Remove**.

**Outside the managed total** (project instructions such as `AGENTS.md`, and
host context: system instructions, built-in tools and skills) is a side
`v-card` on wide screens and a collapsed expansion panel on narrow ones.

**Pin for comparison** is an icon button. When a result is pinned, a closable
`v-chip` names it (host / model / family / role / profile). A `v-table` lists
each layer's pinned and current bytes, with the change as a colored chip.

**Messages:**

- Errors: `v-alert type="error"` shown in place of the result. Configuration,
  lock, trust and `withheld` failures must hide the previous result.
- Notices about removed choices: `v-banner`.
- Confirmations such as "Requested testing": `v-snackbar-queue`.
- First load: `v-skeleton-loader`.

## 3. Skills page

Use `v-data-table`:

- **Search**: a `v-text-field` bound to the table's `search`. Highlight matches
  in name and description with `v-highlight`.
- **Show**: a `v-chip-group` with All, Library packages, Project-local and Used
  by a role.
- **Group by skill name** (`group-by`), so versions and same-name variants
  appear together.
- **Columns:**
  - **Skill**: name and description.
  - **Version / source**: local skills show "unknown version (local,
    unversioned)".
  - **Digest**: a monospace chip with the abbreviated SHA-256 (marked `…`); a
    tooltip shows the full digest, plus a copy button.
  - **Used by**: role chips. Clicking one previews that role on the Resolution
    page and requests the skill when the role offers it as available.
  - **Evidence**: an outlined grey `untested` chip when there are no rows, so a
    missing result does not read as a pass or a failure.
- **Selecting two rows to compare**: `show-select`, limited to two rows, and a
  **Compare selected** button. This replaces the prototype's **Set as left**
  and **Set as right** buttons.
- **Row details**: `show-expand`.
- **Edit actions** (edit mode only): a row menu with **Add to _role_ as
  required / on demand**, **Bind and add**, and **Use for _role_ instead of
  _skill_…**. Unverified entries and host skills show why they cannot be
  added.

## 4. Compare page

- **Sides**: left and right `v-autocomplete` fields with a swap button. Any two
  selectors (`package:<name>@<version>` or `local:<path>`).
- **View**: a `v-btn-toggle` with Unified changes and Side by side, full files.
- **Summary**: two `v-card`s side by side with identity, full digest, source,
  usage and evidence.
- **Files**: one `v-expansion-panels` panel per file with a status chip (same,
  changed, added, removed). Unchanged files start collapsed. Binary files are
  named without contents.
- **Diff lines**: Vuetify has no diff component, so this is the one custom
  widget: a monospace table with numbered lines, colored with theme tokens.
  Use `v-virtual-scroll` for large files.

## 5. Edit mode

Only when `api/config` returns `editing`.

- **Add to configuration**: a `v-dialog` with a `v-form`. A `v-btn-toggle`
  picks Model, Family or Role, and the fields change to match (ID, profile,
  prefixes, description). The prototype's help text becomes `persistent-hint`
  under each field, with validation rules. Hosts cannot be added.
- **Confirmations**: one reusable confirmation dialog (a `useConfirm()`
  composable) for every delete or replacement. Never the browser's
  `confirm()`. Cancelling changes nothing.
- **Replace a same-name variant**: requires a Host and a Model. Call
  `preview-replace` first, then show a dialog with the current package and the
  new one, a `v-list` of each edit and its file, and a `v-alert` for evidence
  and trust blockers. **Cancel** or **Replace** (`apply-replace` with the
  preview digest).
- **409 conflict** (stale revision): an alert with a **Refresh files** action.

## 6. Groundwork

1. **API client and stores**: a typed fetch wrapper that reads the session URL
   (with its token) from `VITE_AP_SESSION_URL`, and Pinia stores for config,
   resolution, library and compare. Edit requests send the headers listed in
   `AGENTS.md`.
2. **Fixtures**: until
   [guisam/Agent-Profiles#124](https://github.com/guisam/Agent-Profiles/issues/124)
   adds `--allow-origin`, the dev server cannot call the API. Save real JSON
   responses from each endpoint and add a fixture mode so screens can be built
   now.
3. **Instruction text is plain text**: render it with `{{ }}` or `<pre>`, never
   `v-html` or a Markdown renderer.
4. **Build order**: Resolution (read-only), Skills table, Compare, Edit mode.

## Open decision

The prototype resets selections on reload. Keeping host, model, family, role,
requested skills and compare sides in the URL query would make views shareable
and survive a reload. It changes documented behavior, so it may need a note in
`docs/visualize.md` upstream. Recommended, not decided.
