/**
 * Calls to the Agent Profiles visualizer API.
 *
 * The session URL (with its token) comes from VITE_AP_SESSION_URL. Without it,
 * the app assumes it is served by the visualizer itself and calls the API
 * relative to the page. With VITE_AP_FIXTURES=true it answers from recorded
 * responses in src/fixtures instead.
 */

import type {
  CompareResponse,
  ConfigEdit,
  ConfigResponse,
  Resolution,
  SkillsResponse,
} from './types'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }

  /** The configuration changed since `api/config` was read. */
  get conflict() {
    return this.status === 409
  }
}

export const fixtureMode = import.meta.env.VITE_AP_FIXTURES === 'true'

function baseUrl() {
  const configured = import.meta.env.VITE_AP_SESSION_URL
  if (configured)
    return configured.endsWith('/') ? configured : `${configured}/`
  // Served by the visualizer: the page is at the session URL.
  return new URL('./', window.location.href.split('#')[0]).href
}

const unavailable =
  'The visualizer server is unavailable. Restart it if needed, then use Refresh files to reconnect.'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (fixtureMode) {
    const { fixtureRequest } = await import('./fixtures')
    return fixtureRequest(path, init) as Promise<T>
  }
  let response: Response
  try {
    response = await fetch(new URL(path, baseUrl()), {
      cache: 'no-store',
      ...init,
    })
  } catch {
    throw new ApiError(unavailable, 0)
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok)
    throw new ApiError(
      data.error ?? `Request failed (${response.status})`,
      response.status,
    )
  return data as T
}

export type Query = Record<string, string | string[] | null | undefined>

function withQuery(path: string, query: Query) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) for (const item of value) params.append(key, item)
    else if (value) params.set(key, value)
  }
  const text = params.toString()
  return text ? `${path}?${text}` : path
}

export const api = {
  config: () => request<ConfigResponse>('api/config'),

  async resolve(query: Query) {
    const result = await request<Resolution>(withQuery('api/resolve', query))
    // A trust policy that withholds skills makes the result partial; never show it as current.
    if (result.withheld?.length)
      throw new ApiError(
        `Trust policy withheld instructions: ${result.withheld
          .map(
            (entry) =>
              `${entry.id} (${entry.package.name}@${entry.package.version}): ${entry.reason}`,
          )
          .join('; ')}`,
        200,
      )
    return result
  },

  skills: () => request<SkillsResponse>('api/skills'),

  compare: (left: string, right: string) =>
    request<CompareResponse>(withQuery('api/compare', { left, right })),

  /** POST one edit. The server checks the revision and returns 409 when it is stale. */
  edit: <T>(revision: string, edit: ConfigEdit) =>
    request<T>('api/edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Profiles-Edit': '1',
      },
      body: JSON.stringify({ revision, edit }),
    }),
}
