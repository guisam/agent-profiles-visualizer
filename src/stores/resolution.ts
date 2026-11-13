/**
 * The Resolution page: configuration choices, the current selection, the
 * resolver's result and a pinned result for comparison. Selections and pins
 * live only for this page session, as in the prototype.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api, type Query } from '@/api/client'
import type { ConfigResponse, Resolution, RoleUse } from '@/api/types'
import { useAppStore } from './app'

export type SelectorKey = 'host' | 'model' | 'family' | 'role'
export type Selection = Record<SelectorKey, string | null>

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

export const useResolutionStore = defineStore('resolution', () => {
  const app = useAppStore()

  const config = ref<ConfigResponse | null>(null)
  const selection = ref<Selection>({
    host: null,
    model: null,
    family: null,
    role: null,
  })
  /** Optional skills requested for this preview only. */
  const requested = ref<string[]>([])
  const result = ref<Resolution | null>(null)
  const error = ref<string | null>(null)
  const notices = ref<string[]>([])
  const pinned = ref<Resolution | null>(null)
  const loading = ref(false)

  // Explicit launch values may deliberately exercise fallback routing; keep them selectable.
  const launchFallbacks: Partial<Record<SelectorKey, string>> = {}
  let requestNumber = 0

  const editing = computed(() => config.value?.editing ?? null)

  /** Choices for one selector, including a launch value that is not configured. */
  function choices(key: SelectorKey) {
    const list =
      {
        host: config.value?.hosts,
        model: config.value?.models,
        family: config.value?.families,
        role: config.value?.roles,
      }[key] ?? []
    const extra = launchFallbacks[key]
    return extra && !list.includes(extra) ? [...list, extra] : list
  }

  function query(from: Selection, skills: string[]): Query {
    return { ...from, skill: skills }
  }

  async function run<T>(work: () => Promise<T>) {
    const number = ++requestNumber
    loading.value = true
    try {
      const value = await app.track(work())
      return number === requestNumber ? { value } : null
    } catch (caught) {
      if (number === requestNumber) {
        // Errors hide the previous result: never present stale or partial instructions.
        result.value = null
        error.value = errorText(caught)
      }
      return null
    } finally {
      if (number === requestNumber) loading.value = false
    }
  }

  /** Load configuration and resolve. `first` uses the launch selection. */
  async function initialize(first = false) {
    const outcome = await run(async () => {
      const data = await api.config()
      const isFirst = first || !config.value
      const next: Selection = isFirst
        ? {
            host: data.initial.host ?? null,
            model: data.initial.model,
            family: data.initial.family,
            role: data.initial.role,
          }
        : { ...selection.value }
      const found: string[] = []
      const lists: [SelectorKey, string[], string | null][] = [
        ['host', data.hosts, null],
        ['model', data.models, null],
        ['family', data.families, null],
        ['role', data.roles, data.defaultRole ?? data.roles[0] ?? null],
      ]
      for (const [key, list, fallback] of lists) {
        const value = next[key]
        if (
          isFirst &&
          (key === 'model' || key === 'family') &&
          value &&
          !list.includes(value)
        )
          launchFallbacks[key] = value
        if (value && !list.includes(value) && value !== launchFallbacks[key]) {
          found.push(
            `${key} ${value} is no longer available; using ${fallback ?? 'unspecified'}.`,
          )
          next[key] = fallback
        }
      }
      const available = next.role ? data.optionalSkills[next.role] : undefined
      const skills = (isFirst ? data.initial.skills : requested.value).filter(
        (skill) => {
          if (!available || available.includes(skill)) return true
          found.push(
            `Optional skill ${skill} is no longer available for ${next.role}; removed from this preview.`,
          )
          return false
        },
      )
      const resolved = await api.resolve(query(next, skills))
      return { data, next, skills, resolved, found }
    })
    if (!outcome) return
    const { data, next, skills, resolved, found } = outcome.value
    config.value = data
    selection.value = next
    requested.value = skills
    result.value = resolved
    error.value = null
    notices.value = found
  }

  /** Resolve the current selection. */
  async function update() {
    const outcome = await run(() =>
      api.resolve(query(selection.value, requested.value)),
    )
    if (!outcome) return
    result.value = outcome.value
    error.value = null
  }

  function select(key: SelectorKey, value: string | null) {
    // A typed model ID need not be configured: the resolver shows which
    // fallback applies. Keep it selectable, like a launch --model.
    if (key === 'model' && value && !config.value?.models.includes(value))
      launchFallbacks.model = value
    selection.value = { ...selection.value, [key]: value }
    // Optional skills belong to a role; changing model or family keeps them.
    if (key === 'role') requested.value = []
    return update()
  }

  function setRequested(skill: string, on: boolean) {
    const others = requested.value.filter((id) => id !== skill)
    requested.value = on ? [...others, skill] : others
    return update()
  }

  /** Show a role that lists a skill, requesting it when the role offers it on demand. */
  async function preview(use: RoleUse & { id: string }) {
    if (!config.value?.roles.includes(use.role)) {
      app.notify(
        `Role ${use.role} is not in the current configuration; use Refresh files.`,
        'error',
      )
      return false
    }
    selection.value = { ...selection.value, role: use.role }
    requested.value = use.list === 'available' ? [use.id] : []
    await update()
    return true
  }

  function pin() {
    pinned.value = result.value
  }

  function clearPin() {
    pinned.value = null
  }

  return {
    config,
    editing,
    selection,
    requested,
    result,
    error,
    notices,
    pinned,
    loading,
    choices,
    initialize,
    update,
    select,
    setRequested,
    preview,
    pin,
    clearPin,
  }
})
