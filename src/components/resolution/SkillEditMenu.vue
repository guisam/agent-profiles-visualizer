<template>
  <v-menu location="bottom end">
    <template #activator="{ props: menu }">
      <v-btn
        v-bind="menu"
        :aria-label="`Edit ${skill}`"
        :disabled="edit.saving"
        density="comfortable"
        icon="mdi-dots-vertical"
        size="small"
        variant="text"
        @click.stop
      />
    </template>
    <v-list density="compact">
      <v-list-item
        :prepend-icon="list === 'required' ? 'mdi-arrow-down' : 'mdi-arrow-up'"
        :title="list === 'required' ? 'Move to on demand' : 'Move to required'"
        @click="
          edit.move(skill, list === 'required' ? 'available' : 'required')
        "
      />
      <v-list-item
        base-color="error"
        prepend-icon="mdi-delete-outline"
        title="Remove from role…"
        @click="edit.remove(skill)"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import type { SkillList } from '@/api/types'
import { useEditStore } from '@/stores/edit'

defineProps<{ skill: string; list: SkillList }>()

const edit = useEditStore()
</script>
