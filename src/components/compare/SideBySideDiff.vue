<template>
  <!-- Vuetify has no diff component; rows are virtualized for large files. -->
  <v-sheet border class="font-mono text-xs" rounded>
    <v-virtual-scroll :items="rows" max-height="600">
      <template #default="{ item }">
        <div class="grid grid-cols-[3rem_minmax(0,1fr)_3rem_minmax(0,1fr)]">
          <span class="pr-2 text-right text-on-surface/50 select-none">
            {{ item.left?.[0] ?? '' }}
          </span>
          <span
            :class="cellClass(item.kind, 'left', item.left)"
            class="pr-2 break-all whitespace-pre-wrap"
            v-text="item.left?.[1] ?? ''"
          />
          <span class="border-l pr-2 text-right text-on-surface/50 select-none">
            {{ item.right?.[0] ?? '' }}
          </span>
          <span
            :class="cellClass(item.kind, 'right', item.right)"
            class="pr-2 break-all whitespace-pre-wrap"
            v-text="item.right?.[1] ?? ''"
          />
        </div>
      </template>
    </v-virtual-scroll>
  </v-sheet>
</template>

<script setup lang="ts">
import type { Cell, FileStatus } from '@/api/types'

defineProps<{
  rows: { kind: FileStatus; left: Cell; right: Cell }[]
}>()

function cellClass(kind: FileStatus, side: 'left' | 'right', cell: Cell) {
  if (!cell) return 'bg-on-surface/5'
  if (kind === 'same') return ''
  return side === 'left' ? 'bg-error/15' : 'bg-success/15'
}
</script>
