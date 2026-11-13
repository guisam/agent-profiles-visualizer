<template>
  <div class="flex items-center gap-2">
    <v-chip :color="statusColor[status]" label size="x-small" variant="tonal">
      {{ status }}
    </v-chip>
    <span class="font-mono text-sm">{{ path }}</span>
  </div>
</template>

<script setup lang="ts">
import type { FileStatus } from '@/api/types'
import { statusColor } from './status'

defineProps<{ path: string; status: FileStatus }>()
</script>
