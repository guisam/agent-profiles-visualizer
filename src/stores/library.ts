/** The skill library: one row per package version and per project-local skill. */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/api/client'
import type { RoleUse, SkillList, SkillsResponse } from '@/api/types'
import { useAppStore } from './app'

export interface CatalogEntry {
  kind: 'package' | 'local'
  /** `package:<name>@<version>` or `local:<path>`, as api/compare expects. */
  selector: string
  name: string
  version: string | null
  source: string
  description: string
  digest: string | null
  uses: (RoleUse & { id: string })[]
  /** Recorded evidence rows; 0 means untested. */
  evidence: number
  /** False for a package version that could not be verified. */
  selectable: boolean
  error: string | null
  /** The configured skill ID a role can list; null until the version is bound. */
  skillId: string | null
  /** The SKILL.md name, shared by variants of one skill. */
  skillName: string | null
  /** Configured skill IDs with the same SKILL.md name. */
  sameName: string[]
  /** Host-native project skill: added through configure, not here. */
  hostSkill: boolean
  /** Rows with the same SKILL.md name (or package) are grouped together. */
  group: string
}

function catalogEntries(data: SkillsResponse): CatalogEntry[] {
  return [
    ...data.packages.flatMap((item) =>
      item.versions.map(
        (version): CatalogEntry => ({
          kind: 'package',
          selector: `package:${item.name}@${version.version}`,
          name: item.name,
          version: version.version,
          source: version.error ? 'unverified' : `library ${version.source}`,
          description: version.description ?? '',
          digest: version.sha256 ?? null,
          uses: (version.usage?.roles ?? []).map((use) => ({
            ...use,
            id: use.skill ?? item.name,
          })),
          evidence: version.evidence ?? 0,
          selectable: !version.error,
          error: version.error ?? null,
          skillId:
            (version.usage?.bindings ?? [])
              .map((binding) => /(?:^|\.)skills\.([^.]+)$/.exec(binding)?.[1])
              .find(Boolean) ?? null,
          skillName: version.skillName ?? null,
          sameName: version.sameName ?? [],
          hostSkill: false,
          group: version.skillName ?? item.name,
        }),
      ),
    ),
    ...data.local.map(
      (skill): CatalogEntry => ({
        kind: 'local',
        selector: `local:${skill.path}`,
        name: skill.id,
        version: null,
        source: `project-local · ${skill.path}`,
        description: skill.description ?? '',
        digest: null,
        uses: skill.usage.roles.map((use) => ({ ...use, id: skill.id })),
        evidence: 0,
        selectable: true,
        error: null,
        // Host-native project skills need a host reference, not a plain ID.
        skillId: skill.host ? null : skill.id,
        skillName: skill.skillName ?? null,
        sameName: skill.sameName ?? [],
        hostSkill: Boolean(skill.host),
        group: skill.skillName ?? skill.id,
      }),
    ),
  ]
}

export const entryLabel = (entry: {
  kind: string
  name: string
  version: string | null
}) =>
  `${entry.name}@${entry.version ?? 'unversioned'} (${entry.kind === 'local' ? 'project-local' : 'library'})`

export const useLibraryStore = defineStore('library', () => {
  const app = useAppStore()
  const data = ref<SkillsResponse | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  const entries = computed(() => (data.value ? catalogEntries(data.value) : []))
  const roles = computed(() => data.value?.roles ?? {})
  const packageSkills = computed(() => data.value?.packageSkills ?? [])
  const problems = computed(() => data.value?.problems ?? [])

  async function load() {
    loading.value = true
    try {
      data.value = await app.track(api.skills())
      error.value = null
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : String(caught)
    } finally {
      loading.value = false
    }
  }

  /** Reload only when the library has been loaded before. */
  async function refresh() {
    if (data.value) await load()
  }

  /** A same-name skill (or this entry's own binding) that the role already lists. */
  function listedVariant(entry: CatalogEntry, role: string | null) {
    const lists = role ? roles.value[role] : undefined
    if (!lists) return null
    const listed = [...lists.required, ...lists.available]
    return (
      [...entry.sameName, ...(entry.skillId ? [entry.skillId] : [])].find(
        (id) => listed.includes(id),
      ) ?? null
    )
  }

  /** The list a role already uses the entry's own skill ID in, if any. */
  function listedIn(
    entry: CatalogEntry,
    role: string | null,
  ): SkillList | null {
    const lists = role ? roles.value[role] : undefined
    if (!lists || !entry.skillId) return null
    if (lists.required.includes(entry.skillId)) return 'required'
    if (lists.available.includes(entry.skillId)) return 'available'
    return null
  }

  return {
    data,
    entries,
    roles,
    packageSkills,
    problems,
    error,
    loading,
    load,
    refresh,
    listedVariant,
    listedIn,
  }
})
