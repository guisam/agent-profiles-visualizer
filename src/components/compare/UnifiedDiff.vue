<template>
  <!-- Vuetify has no diff component; lines are plain text colored by theme tokens. -->
  <v-sheet border class="overflow-x-auto font-mono text-xs" rounded>
    <div
      v-for="(line, index) in lines"
      :key="index"
      :class="lineClass(line)"
      class="min-h-4 px-3 whitespace-pre"
      v-text="line"
    />
  </v-sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ diff: string }>()

const lines = computed(() => props.diff.split('\n'))

function lineClass(line: string) {
  if (line.startsWith('+++') || line.startsWith('---'))
    return 'font-bold text-on-surface/70'
  if (line.startsWith('@@')) return 'bg-info/10 text-info'
  if (line.startsWith('+')) return 'bg-success/15'
  if (line.startsWith('-')) return 'bg-error/15'
  return ''
}
</script>
