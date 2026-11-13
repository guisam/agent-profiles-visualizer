<template>
  <v-container class="flex flex-col gap-4 py-6" fluid>
    <v-card variant="flat">
      <v-card-item>
        <v-card-title>Skill library</v-card-title>
        <v-card-subtitle class="text-wrap">
          Library skill packages and project-local skills. Browsing, comparison
          and preview never change configuration, pins or skill files.
        </v-card-subtitle>
      </v-card-item>

      <v-card-text class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <v-text-field
            v-model="search"
            class="max-w-md min-w-60 flex-1"
            clearable
            density="comfortable"
            hide-details
            label="Search name and description"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
          />
          <v-chip-group
            v-model="show"
            color="primary"
            mandatory
            selected-class="font-medium"
          >
            <v-chip
              v-for="option in showOptions"
              :key="option.value"
              :value="option.value"
              filter
              label
            >
              {{ option.title }}
            </v-chip>
          </v-chip-group>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <v-select
            v-if="resolution.editing"
            :items="resolution.config?.roles ?? []"
            :model-value="resolution.selection.role"
            class="max-w-xs"
            density="compact"
            hide-details
            label="Add to role"
            prepend-inner-icon="mdi-account-hard-hat-outline"
            variant="outlined"
            @update:model-value="
              (value: string | null) => resolution.select('role', value)
            "
          />
          <v-spacer />
          <span class="text-sm text-on-surface/70">
            {{ selected.length }}
            of 2 selected for comparison
          </span>
          <v-btn
            :disabled="selected.length !== 2"
            color="primary"
            prepend-icon="mdi-compare-horizontal"
            variant="flat"
            @click="compareSelected"
          >
            Compare selected
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-alert
      v-if="library.error"
      title="The skill library could not be loaded"
      type="error"
      variant="tonal"
    >
      {{ library.error }}
    </v-alert>

    <v-alert
      v-if="library.problems.length"
      title="Library problems"
      type="warning"
      variant="tonal"
    >
      <ul class="list-disc pl-5">
        <li v-for="problem in library.problems" :key="problem">
          {{ problem }}
        </li>
      </ul>
    </v-alert>

    <v-card variant="outlined">
      <v-data-table
        v-model="selected"
        v-model:expanded="expanded"
        :filter-keys="['name', 'description']"
        :group-by="[{ key: 'group', order: 'asc' }]"
        :headers="headers"
        :items="shown"
        :items-per-page="50"
        :loading="library.loading"
        :search="search ?? ''"
        density="comfortable"
        item-selectable="selectable"
        item-value="selector"
        no-data-text="No skills match this search."
        show-expand
        show-select
      >
        <template #group-header="{ item, columns, toggleGroup, isGroupOpen }">
          <tr>
            <td :colspan="columns.length" class="bg-surface">
              <div class="flex items-center gap-2">
                <v-btn
                  :aria-label="
                    isGroupOpen(item) ? 'Collapse group' : 'Expand group'
                  "
                  :icon="
                    isGroupOpen(item) ? 'mdi-chevron-down' : 'mdi-chevron-right'
                  "
                  density="comfortable"
                  size="small"
                  variant="text"
                  @click="toggleGroup(item)"
                />
                <span class="font-medium">{{ item.value }}</span>
                <v-chip label size="x-small" variant="tonal">
                  {{ item.items.length }}
                  {{ item.items.length === 1 ? 'entry' : 'entries' }}
                </v-chip>
              </div>
            </td>
          </tr>
        </template>

        <template #header.data-table-select />

        <template #item.name="{ item }">
          <div class="py-2">
            <v-highlight
              :query="search ?? ''"
              :text="item.name"
              class="font-medium"
            />
            <div
              v-if="item.description"
              class="line-clamp-2 max-w-lg text-xs text-on-surface/70"
            >
              <v-highlight :query="search ?? ''" :text="item.description" />
            </div>
          </div>
        </template>

        <template #item.version="{ item }">
          <div class="flex flex-col gap-1 py-1">
            <span>{{
              item.version ?? 'unknown version (local, unversioned)'
            }}</span>
            <span class="text-xs text-on-surface/70">{{ item.source }}</span>
          </div>
        </template>

        <template #item.digest="{ item }">
          <span v-if="!item.digest" class="text-xs text-on-surface/70">
            unavailable
          </span>
          <div v-else class="flex items-center">
            <v-tooltip location="top" :text="`sha256:${item.digest}`">
              <template #activator="{ props: tooltip }">
                <v-chip v-bind="tooltip" class="font-mono" label size="small">
                  {{ shortDigest(item.digest) }}
                </v-chip>
              </template>
            </v-tooltip>
            <CopyButton
              :text="`sha256:${item.digest}`"
              label="Copy full digest"
            />
          </div>
        </template>

        <template #item.uses="{ item }">
          <span v-if="!item.uses.length" class="text-xs text-on-surface/70">
            Not used by a role
          </span>
          <div v-else class="flex flex-wrap gap-1 py-1">
            <v-tooltip
              v-for="use in item.uses"
              :key="`${use.role}-${use.list}`"
              location="top"
              :text="`Preview ${use.role} with ${use.id}${use.list === 'available' ? ' requested' : ''}`"
            >
              <template #activator="{ props: tooltip }">
                <v-chip
                  v-bind="tooltip"
                  :prepend-icon="
                    use.list === 'required'
                      ? 'mdi-check-circle-outline'
                      : 'mdi-circle-outline'
                  "
                  label
                  size="small"
                  @click="previewUse(use)"
                >
                  {{ usageText(use) }}
                </v-chip>
              </template>
            </v-tooltip>
          </div>
        </template>

        <template #item.evidence="{ item }">
          <v-chip
            v-if="item.evidence"
            color="success"
            label
            size="small"
            variant="tonal"
          >
            {{ item.evidence }}
            evidence row(s)
          </v-chip>
          <v-chip v-else label size="small" variant="outlined">
            untested
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <AddToRoleMenu :entry="item" />
        </template>

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="py-3">
              <dl
                class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm"
              >
                <dt class="text-on-surface/70">Selector</dt>
                <dd class="font-mono break-all">{{ item.selector }}</dd>
                <dt class="text-on-surface/70">Source</dt>
                <dd>{{ item.source }}</dd>
                <template v-if="item.digest">
                  <dt class="text-on-surface/70">SHA-256</dt>
                  <dd class="font-mono break-all">{{ item.digest }}</dd>
                </template>
                <template v-if="item.skillName">
                  <dt class="text-on-surface/70">SKILL.md name</dt>
                  <dd>{{ item.skillName }}</dd>
                </template>
                <template v-if="item.sameName.length">
                  <dt class="text-on-surface/70">Same-name skills</dt>
                  <dd>{{ item.sameName.join(', ') }}</dd>
                </template>
                <template v-if="item.error">
                  <dt class="text-on-surface/70">Unverified</dt>
                  <dd class="text-error">{{ item.error }}</dd>
                </template>
              </dl>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { RoleUse } from '@/api/types'
import CopyButton from '@/components/CopyButton.vue'
import AddToRoleMenu from '@/components/library/AddToRoleMenu.vue'
import { useCompareStore } from '@/stores/compare'
import { useLibraryStore } from '@/stores/library'
import { useResolutionStore } from '@/stores/resolution'
import { shortDigest, usageText } from '@/utils/format'

const library = useLibraryStore()
const resolution = useResolutionStore()
const compare = useCompareStore()
const router = useRouter()

const search = ref<string | null>('')
type Show = 'all' | 'package' | 'local' | 'used'
const show = ref<Show>('all')
const showOptions: { value: Show; title: string }[] = [
  { value: 'all', title: 'All skills' },
  { value: 'package', title: 'Library packages' },
  { value: 'local', title: 'Project-local' },
  { value: 'used', title: 'Used by a role' },
]

const selected = ref<string[]>([])
const expanded = ref<string[]>([])

// Comparison takes exactly two entries: keep the two most recent picks.
watch(selected, (value) => {
  if (value.length > 2) selected.value = value.slice(-2)
})

const shown = computed(() =>
  library.entries.filter((entry) =>
    show.value === 'all'
      ? true
      : show.value === 'used'
        ? entry.uses.length > 0
        : entry.kind === show.value,
  ),
)

const headers = computed(() => [
  { title: 'Skill', key: 'name', sortable: true },
  { title: 'Version / source', key: 'version', sortable: false },
  { title: 'Digest', key: 'digest', sortable: false },
  { title: 'Used by', key: 'uses', sortable: false },
  { title: 'Evidence', key: 'evidence', sortable: false },
  ...(resolution.editing
    ? [{ title: 'Add to role', key: 'actions', sortable: false }]
    : []),
])

async function previewUse(use: RoleUse & { id: string }) {
  if (await resolution.preview(use)) router.push('/')
}

function compareSelected() {
  const [left, right] = selected.value
  if (!left || !right) return
  compare.left = left
  compare.right = right
  router.push('/skills/compare')
  compare.run()
}

onMounted(() => {
  if (!library.data) library.load()
})
</script>
