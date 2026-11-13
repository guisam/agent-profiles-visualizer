<template>
  <v-card variant="outlined">
    <v-card-item>
      <v-card-title class="text-base">Compare resolutions</v-card-title>
      <v-card-subtitle class="text-wrap">
        {{ label(pinned) }}
        → {{ label(current) }}
      </v-card-subtitle>
      <template #append>
        <v-btn
          prepend-icon="mdi-pin-off-outline"
          variant="text"
          @click="emit('clear')"
        >
          Clear
        </v-btn>
      </template>
    </v-card-item>

    <v-table density="compact">
      <thead>
        <tr>
          <th scope="col">Layer</th>
          <th class="text-right" scope="col">Pinned</th>
          <th class="text-right" scope="col">Current</th>
          <th class="text-right" scope="col">Change</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.title">
          <th class="font-normal" scope="row">{{ row.title }}</th>
          <td class="text-right">{{ bytes(row.before) }}</td>
          <td class="text-right">{{ bytes(row.after) }}</td>
          <td class="text-right">
            <v-chip
              :color="
                row.after > row.before
                  ? 'warning'
                  : row.after < row.before
                    ? 'success'
                    : undefined
              "
              label
              size="small"
              variant="tonal"
            >
              {{ byteChange(row.after - row.before) }}
            </v-chip>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-card-text class="text-sm text-on-surface/70">
      The pinned resolution is a snapshot from this browser session.
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Resolution } from '@/api/types'
import { byteChange, bytes } from '@/utils/format'

const props = defineProps<{ pinned: Resolution; current: Resolution }>()
const emit = defineEmits<{ clear: [] }>()

const label = (result: Resolution) =>
  `${result.host ?? 'Unspecified host'} / ${result.model ?? 'Default model'} / ${result.family ?? 'no family'} / ${result.role} / ${result.profile}`

type ManagedKey = keyof Resolution['diagnostics']['managed']

const rows = computed(() => {
  const keys: [ManagedKey | 'availableNotLoaded', string][] = [
    ['profile', 'Profile'],
    ['role', 'Role'],
    ['requiredSkills', 'Required skills'],
    ['requestedSkills', 'Requested skills'],
    ['total', 'Managed total'],
    ['availableNotLoaded', 'Available, not injected'],
  ]
  const pick = (result: Resolution, key: ManagedKey | 'availableNotLoaded') =>
    key === 'availableNotLoaded'
      ? result.diagnostics.availableNotLoaded.bytes
      : result.diagnostics.managed[key].bytes
  return keys.map(([key, title]) => ({
    title,
    before: pick(props.pinned, key),
    after: pick(props.current, key),
  }))
})
</script>
