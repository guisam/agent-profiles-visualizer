<template>
  <v-card variant="outlined">
    <v-card-item>
      <v-card-subtitle>{{ title }}</v-card-subtitle>
      <v-card-title class="text-wrap break-all">
        {{ side.name }}@{{ side.version ?? 'unversioned' }}
      </v-card-title>
      <template #append>
        <v-chip label size="small" variant="tonal">
          {{
            side.kind === 'local' ? 'Project-local skill' : 'Library package'
          }}
        </v-chip>
      </template>
    </v-card-item>

    <v-card-text>
      <dl class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
        <template v-for="fact in facts" :key="fact.term">
          <dt class="text-on-surface/70">{{ fact.term }}</dt>
          <dd :class="{ 'font-mono break-all': fact.mono }">
            {{ fact.value }}
          </dd>
        </template>
        <dt class="text-on-surface/70">Evidence</dt>
        <dd>
          <v-chip
            v-if="side.evidence.status === 'untested'"
            label
            size="small"
            variant="outlined"
          >
            untested
          </v-chip>
          <span v-else>{{ evidenceText }}</span>
        </dd>
      </dl>

      <p class="mt-4 mb-1 text-xs font-medium tracking-wide uppercase">Files</p>
      <v-list border density="compact" rounded>
        <v-list-item
          v-for="file in side.files"
          :key="file.path"
          :subtitle="`${bytes(file.bytes)} · ${file.binary ? 'binary' : 'text'} · ${shortDigest(file.sha256)}`"
          :title="file.path"
        />
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CompareSide } from '@/api/types'
import { bytes, shortDigest, usageText } from '@/utils/format'

const props = defineProps<{ side: CompareSide; title: string }>()

const facts = computed(() => {
  const { side } = props
  return [
    {
      term: 'Version',
      value: side.version ?? 'Unknown: local skills have no package version',
    },
    {
      term: 'SHA-256',
      value: side.sha256 ?? 'Unavailable for local skills',
      mono: Boolean(side.sha256),
    },
    { term: 'Revision', value: side.revisionDigest ?? 'None', mono: true },
    { term: 'Source', value: side.path ?? side.source ?? 'Unknown' },
    {
      term: 'Description',
      value: side.metadata.description ?? 'None declared',
    },
    {
      term: 'Used by',
      value: side.usage.roles.length
        ? side.usage.roles.map(usageText).join(', ')
        : 'Not used by a role',
    },
  ]
})

const evidenceText = computed(() =>
  props.side.evidence.rows
    .map(
      (row) =>
        `${row.assignment.role} × ${row.assignment.model} × ${row.assignment.host}: ${row.outcome}`,
    )
    .join('; '),
)
</script>
