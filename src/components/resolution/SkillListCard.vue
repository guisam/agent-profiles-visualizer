<template>
  <v-card variant="outlined">
    <v-card-item>
      <v-card-title class="flex items-center gap-2 text-base">
        {{ list === 'required' ? 'Required' : 'On demand' }}
        <v-chip
          :variant="list === 'required' ? 'flat' : 'outlined'"
          color="primary"
          label
          size="x-small"
        >
          {{ list === 'required' ? 'Loaded' : 'Preview' }}
        </v-chip>
      </v-card-title>
      <v-card-subtitle>
        {{
          list === 'required'
            ? size(managed.requiredSkills)
            : `Requested: ${size(managed.requestedSkills)}`
        }}
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <p v-if="list === 'available'" class="mb-3 text-sm text-on-surface/70">
        Select a skill to project its context. No configuration is changed.
      </p>
      <p v-if="!rows.length" class="text-sm text-on-surface/70">
        {{
          list === 'required'
            ? 'No required skills.'
            : 'No on-demand skills for this role.'
        }}
      </p>

      <v-expansion-panels v-else multiple variant="accordion">
        <v-expansion-panel v-for="row in rows" :key="row.id">
          <v-expansion-panel-title>
            <div class="flex w-full items-center gap-2 pr-2">
              <v-checkbox-btn
                v-if="row.checkable"
                :aria-label="`Request ${row.id}`"
                :disabled="store.loading"
                :model-value="row.injected"
                density="compact"
                @click.stop
                @update:model-value="
                  (on: boolean | null) =>
                    store.setRequested(row.id, Boolean(on))
                "
              />
              <span class="font-medium">{{ row.id }}</span>
              <v-chip v-if="row.host" label size="x-small" variant="outlined">
                host skill
              </v-chip>
              <v-chip
                v-else-if="list === 'available'"
                :color="row.injected ? 'success' : undefined"
                label
                size="x-small"
                variant="tonal"
              >
                {{
                  row.injected
                    ? 'Requested, injected'
                    : 'Available, not injected'
                }}
              </v-chip>
              <v-spacer />
              <v-chip
                v-if="!row.host && row.entry.bytes !== undefined"
                label
                size="small"
              >
                {{ bytes(row.entry.bytes) }}
              </v-chip>
              <SkillEditMenu
                v-if="store.editing"
                :list="list"
                :skill="row.id"
              />
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <EntryDetails :entry="row.entry" :provenance="row.provenance" />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  LoadedEntry,
  Resolution,
  SkillEntry,
  SkillList,
} from '@/api/types'
import { useResolutionStore } from '@/stores/resolution'
import { bytes, size } from '@/utils/format'
import EntryDetails from './EntryDetails.vue'
import SkillEditMenu from './SkillEditMenu.vue'

const props = defineProps<{ list: SkillList; result: Resolution }>()

const store = useResolutionStore()

interface Row {
  id: string
  entry: SkillEntry | LoadedEntry
  provenance: string
  host: boolean
  checkable: boolean
  injected: boolean
}

const result = computed(() => props.result)
const managed = computed(() => result.value.diagnostics.managed)

const rows = computed<Row[]>(() => {
  const { role, loaded } = result.value
  if (props.list === 'required') {
    const injected = loaded
      .filter((entry) => entry.kind === 'required-skill')
      .map(
        (entry): Row => ({
          id: entry.id,
          entry,
          provenance: `Required by role: ${role}`,
          host: false,
          checkable: false,
          injected: true,
        }),
      )
    const hosted = result.value.required
      .filter((entry) => entry.type === 'host')
      .map(
        (entry): Row => ({
          id: entry.id,
          entry,
          provenance: `Required by role ${role}; ${entry.package ? 'invocation unverified' : 'invoked through the host'}`,
          host: true,
          checkable: false,
          injected: false,
        }),
      )
    return [...injected, ...hosted]
  }
  return result.value.available.map((entry): Row => {
    if (entry.type === 'host')
      return {
        id: entry.id,
        entry,
        provenance: `Available to role ${role}; ${entry.package ? 'invocation unverified' : 'invoked through the host'}, never injected`,
        host: true,
        checkable: false,
        injected: false,
      }
    const own = loaded.find(
      (item) => item.kind === 'requested-skill' && item.id === entry.id,
    )
    // A requested package skill can share backing that another entry already injected.
    const shared =
      !own &&
      entry.package &&
      result.value.requestedSkills?.includes(entry.id) &&
      loaded.find(
        (part) =>
          part.package?.name === entry.package?.name &&
          part.package?.version === entry.package?.version &&
          part.package?.sha256 === entry.package?.sha256 &&
          part.package?.revisionDigest === entry.package?.revisionDigest &&
          part.backing?.path === entry.backing?.path,
      )
    const injected = Boolean(own || shared)
    return {
      id: entry.id,
      entry: shared
        ? { ...entry, binding: entry.package?.binding }
        : (own ?? entry),
      provenance: `${injected ? 'Requested for' : 'Available to'} role: ${role}${shared ? '; shares already injected backing' : ''}`,
      host: false,
      checkable: true,
      injected,
    }
  })
})
</script>
