/**
 * Configuration edits (server started with `--edit`). Every edit is sent with
 * the revision from api/config; afterwards configuration, resolution and the
 * library are reloaded so the page shows what was written. Deletes and
 * replacements ask for confirmation first.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError, api } from '@/api/client'
import type {
  ConfigEdit,
  EditResult,
  ReplacePlan,
  SkillList,
} from '@/api/types'
import { useConfirm } from '@/composables/useConfirm'
import { useAppStore } from './app'
import { type CatalogEntry, entryLabel, useLibraryStore } from './library'
import { useResolutionStore } from './resolution'

const listName = (list: SkillList) =>
  list === 'available' ? 'on demand' : 'required'

export const useEditStore = defineStore('edit', () => {
  const app = useAppStore()
  const resolution = useResolutionStore()
  const library = useLibraryStore()
  const { confirm } = useConfirm()

  /** The last failed edit; a conflict offers Refresh files. */
  const error = ref<{ text: string; conflict: boolean } | null>(null)
  const saving = ref(false)

  async function post<T>(edit: ConfigEdit) {
    const revision = resolution.editing?.revision
    if (!revision) throw new Error('Edits are off; start visualize with --edit')
    return app.track(api.edit<T>(revision, edit))
  }

  function fail(caught: unknown) {
    const conflict = caught instanceof ApiError && caught.conflict
    error.value = {
      text: conflict
        ? 'The configuration changed since this page loaded. Nothing was written. Use Refresh files, then try again.'
        : caught instanceof Error
          ? caught.message
          : String(caught),
      conflict,
    }
  }

  /** Send one edit, then reload everything that reads the configuration. */
  async function apply(edit: ConfigEdit, done: string) {
    error.value = null
    saving.value = true
    try {
      const written = await post<EditResult>(edit)
      await resolution.initialize()
      await library.refresh()
      app.notify(
        `${done}. Written to ${written.file} (${written.layer} configuration); locks refreshed.`,
      )
      return true
    } catch (caught) {
      fail(caught)
      return false
    } finally {
      saving.value = false
    }
  }

  function currentRole() {
    return resolution.result?.role ?? resolution.selection.role ?? ''
  }

  /** Adding a skill to the other list moves it there. */
  function move(skill: string, to: SkillList) {
    const role = currentRole()
    return apply(
      { action: 'add-skill', role, skill, list: to },
      `${skill} moved to ${listName(to)} for ${role}`,
    )
  }

  async function remove(skill: string) {
    const role = currentRole()
    const confirmed = await confirm({
      title: `Remove ${skill} from ${role}?`,
      text: 'This edits your configuration now and refreshes locks. The skill stays in the library and can be added again.',
      confirmText: 'Remove',
      destructive: true,
    })
    if (!confirmed) {
      app.notify(`Kept ${skill} in ${role}; nothing was changed.`, 'info')
      return false
    }
    return apply(
      { action: 'remove-skill', role, skill },
      `${skill} removed from ${role}`,
    )
  }

  /** Add a library entry to the selected role, binding it first when needed. */
  async function addToRole(entry: CatalogEntry, list: SkillList) {
    const role = resolution.selection.role ?? ''
    const variant = library.listedVariant(entry, role)
    const label = entryLabel(entry)
    if (variant && variant !== entry.skillId) {
      const confirmed = await confirm({
        title: `Replace ${variant} in ${role}?`,
        text: `Role ${role} already lists ${variant}, a skill named "${entry.skillName}". Replace it with ${label} as ${listName(list)}? This edits your configuration now and refreshes locks.`,
        confirmText: 'Replace',
        destructive: true,
      })
      if (!confirmed) {
        app.notify(`Kept ${variant} in ${role}; nothing was changed.`, 'info')
        return false
      }
      if (entry.kind === 'package' && !entry.skillId)
        return apply(
          {
            action: 'bind-skill',
            role,
            list,
            package: entry.name,
            version: entry.version ?? '',
            replace: variant,
          },
          `${label} replaced ${variant} in ${role} as ${listName(list)}`,
        )
      // Two edits, each validated and written on its own.
      const removed = await apply(
        { action: 'remove-skill', role, skill: variant },
        `${variant} removed from ${role}`,
      )
      if (!removed || !entry.skillId) return false
      return apply(
        { action: 'add-skill', role, skill: entry.skillId, list },
        `${label} replaced ${variant} in ${role} as ${listName(list)}`,
      )
    }
    if (entry.skillId)
      return apply(
        { action: 'add-skill', role, skill: entry.skillId, list },
        `${entry.skillId} added to ${role} as ${listName(list)}`,
      )
    return apply(
      {
        action: 'bind-skill',
        role,
        list,
        package: entry.name,
        version: entry.version ?? '',
      },
      `${label} bound and added to ${role} as ${listName(list)}`,
    )
  }

  /**
   * Choose another package version for one host × model × role, as
   * `agent-profiles update` does: preview, confirm, then apply.
   */
  async function replaceVariant(entry: CatalogEntry, skill: string) {
    const { host, model, role } = resolution.selection
    if (!host || !model || !role) {
      app.notify(
        `Select a Host and a Model first. A variant replaces ${skill} for one host × model × role.`,
        'error',
      )
      return false
    }
    const request = {
      binding: `skills.${skill}`,
      target: `${entry.name}@${entry.version}`,
      assignment: { role, model, host },
    }
    const tuple = `${role} × ${model} × ${host}`
    error.value = null
    let plan: ReplacePlan
    try {
      plan = await post<ReplacePlan>({ action: 'preview-replace', ...request })
    } catch (caught) {
      fail(caught)
      return false
    }
    if (plan.status === 'already-pinned') {
      app.notify(
        `${skill} already selects ${request.target} for ${tuple}; nothing to change.`,
        'info',
      )
      return false
    }
    if (plan.trustBlockers.length) {
      error.value = {
        text: `The trust policy refuses ${request.target}: ${plan.trustBlockers.join('; ')}. Nothing was written.`,
        conflict: false,
      }
      return false
    }
    const confirmed = await confirm({
      title: `Replace ${skill} for ${tuple}?`,
      text: `Now: ${plan.before.package}@${plan.before.version}. New: ${plan.after.package}@${plan.after.version}. Other host × model × role selections stay unchanged. Locks are refreshed.`,
      items: plan.edits.map((item) => ({
        title: item.description,
        subtitle: item.file,
      })),
      alert: plan.evidence.length
        ? {
            type: 'info',
            text: `Evidence: ${plan.evidence.length} recorded result(s).`,
          }
        : {
            type: 'warning',
            text: 'Evidence: untested for this host × model × role.',
          },
      confirmText: 'Replace',
      destructive: true,
    })
    if (!confirmed) {
      app.notify(
        `Kept ${plan.before.package}@${plan.before.version}; nothing was changed.`,
        'info',
      )
      return false
    }
    return apply(
      { action: 'apply-replace', ...request, expect: plan.previewDigest },
      `${skill} now selects ${request.target} for ${tuple}`,
    )
  }

  /** Add a model, family or role, then select it so its resolution shows. */
  async function addConfig(
    edit: Extract<
      ConfigEdit,
      { action: 'add-model' | 'add-family' | 'add-role' }
    >,
  ) {
    const kind = edit.action.slice(4) as 'model' | 'family' | 'role'
    const added = await apply(edit, `${kind} ${edit.id} added`)
    if (added) await resolution.select(kind, edit.id)
    return added
  }

  return {
    error,
    saving,
    move,
    remove,
    addToRole,
    replaceVariant,
    addConfig,
  }
})
