/**
 * Fixture mode: answers API calls from responses recorded from a real
 * `agent-profiles visualize --edit` server. Used until the dev server can call
 * the live API (guisam/Agent-Profiles#124).
 *
 * Each folder in src/fixtures is one recorded project. VITE_AP_FIXTURE_SET
 * picks the folder (default: "default"). Selections and comparisons that were
 * not recorded return a 400. Edits are accepted but change nothing.
 */

import { ApiError } from './client'

interface FixtureSet {
  config: { defaultRole: string }
  skills: unknown
  resolve: Record<string, unknown>
  compare: Record<string, unknown>
}

const files = import.meta.glob<unknown>('/src/fixtures/*/*.json', {
  import: 'default',
})

export const fixtureSet = import.meta.env.VITE_AP_FIXTURE_SET || 'default'

let loaded: Promise<FixtureSet> | null = null

/** Load the selected set's four files once. */
function load() {
  loaded ??= (async () => {
    const parts = ['config', 'skills', 'resolve', 'compare'] as const
    const values = await Promise.all(
      parts.map((part) => {
        const loader = files[`/src/fixtures/${fixtureSet}/${part}.json`]
        if (!loader)
          throw new ApiError(
            `Fixture set "${fixtureSet}" is missing ${part}.json. Record it with scripts/capture-fixtures.mjs, or change VITE_AP_FIXTURE_SET.`,
            404,
          )
        return loader()
      }),
    )
    return Object.fromEntries(
      parts.map((part, index) => [part, values[index]]),
    ) as unknown as FixtureSet
  })()
  return loaded
}

/** A recorded server error is replayed as an error, not a result. */
function replay(result: unknown) {
  if (result && typeof result === 'object' && 'error' in result)
    throw new ApiError(String(result.error), 400)
  return structuredClone(result)
}

/** The recorded key: parameters in host, model, family, role, skill order. */
function resolveKey(params: URLSearchParams, defaultRole: string) {
  const sorted = new URLSearchParams()
  for (const key of ['host', 'model', 'family', 'role']) {
    const value = params.get(key)
    if (value) sorted.set(key, value)
  }
  if (!sorted.has('role')) sorted.set('role', defaultRole)
  for (const skill of params.getAll('skill').sort())
    sorted.append('skill', skill)
  return sorted.toString()
}

const delay = () => new Promise((resolve) => setTimeout(resolve, 150))

export async function fixtureRequest(path: string, init?: RequestInit) {
  const [set] = await Promise.all([load(), delay()])
  const url = new URL(path, 'http://fixture/')
  switch (url.pathname.slice(1)) {
    case 'api/config':
      return structuredClone(set.config)
    case 'api/skills':
      return structuredClone(set.skills)
    case 'api/resolve': {
      const result =
        set.resolve[resolveKey(url.searchParams, set.config.defaultRole)]
      if (!result)
        throw new ApiError(
          `Fixture mode has no recorded resolution for ${url.search || 'the default selection'}. Choose another combination, or run against a live server.`,
          400,
        )
      return replay(result)
    }
    case 'api/compare': {
      const key = new URLSearchParams({
        left: url.searchParams.get('left') ?? '',
        right: url.searchParams.get('right') ?? '',
      }).toString()
      const result = set.compare[key]
      if (!result)
        throw new ApiError(
          'Fixture mode has no recorded comparison for these two skills. It records skills in the same group on the Skills tab (same SKILL.md name or package) and project-local skills against each other. Compare any pair against a live server.',
          400,
        )
      return replay(result)
    }
    case 'api/edit': {
      const { edit } = JSON.parse(String(init?.body ?? '{}'))
      if (edit.action === 'preview-replace')
        throw new ApiError(
          'Fixture mode cannot preview a replacement. Run against a live server.',
          400,
        )
      return { layer: 'project', file: '.agent-profiles/agents.yaml' }
    }
    default:
      throw new ApiError('Not found', 404)
  }
}
