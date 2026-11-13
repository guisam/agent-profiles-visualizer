<template>
  <div class="flex flex-col gap-4">
    <section v-for="layer in layers" :key="layer.title">
      <h3 class="mb-2 text-sm font-medium tracking-wide uppercase">
        {{ layer.title }}
      </h3>
      <v-expansion-panels multiple variant="accordion">
        <v-expansion-panel v-for="entry in layer.entries" :key="entry.id">
          <v-expansion-panel-title>
            <div class="flex w-full items-center gap-2 pr-2">
              <span class="font-medium">{{ entry.id }}</span>
              <v-chip
                v-if="layer.owner"
                label
                size="x-small"
                variant="outlined"
              >
                {{ entry.kind === 'workflow' ? 'workflow' : 'dependency' }}
                of
                {{ entry.owner }}
              </v-chip>
              <v-spacer />
              <v-chip label size="small">{{ bytes(entry.bytes) }}</v-chip>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <EntryDetails
              :entry="entry"
              :provenance="layer.provenance(entry)"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LoadedEntry, Resolution } from '@/api/types'
import { bytes } from '@/utils/format'
import EntryDetails from './EntryDetails.vue'

const props = defineProps<{ result: Resolution }>()

const layers = computed(() => {
  const { result } = props
  const of = (...kinds: LoadedEntry['kind'][]) =>
    result.loaded.filter((entry) => kinds.includes(entry.kind))
  const list = [
    {
      title: '01 / Model profile',
      entries: of('profile'),
      owner: false,
      provenance: () => `Selected by ${result.matchedBy} routing`,
    },
    {
      title: '02 / Assigned role',
      entries: of('role'),
      owner: false,
      provenance: () => `Active role: ${result.role}`,
    },
    {
      title: 'Companions',
      entries: of('dependency', 'workflow'),
      owner: true,
      provenance: (entry: LoadedEntry) =>
        `${entry.kind === 'workflow' ? 'Workflow companion' : 'Dependency'} for ${entry.owner}`,
    },
  ]
  return list.filter((layer) => layer.entries.length)
})
</script>
