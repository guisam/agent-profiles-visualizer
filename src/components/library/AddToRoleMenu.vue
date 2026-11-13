<template>
  <span v-if="entry.hostSkill" class="text-xs text-on-surface/70">
    Host skill: add through configure
  </span>
  <span v-else-if="!entry.selectable" class="text-xs text-on-surface/70">
    Unverified
  </span>
  <span v-else-if="!role" class="text-xs text-on-surface/70">
    Choose a role first
  </span>

  <!-- A variant of a package skill the role lists: choose it per host × model × role. -->
  <v-btn
    v-else-if="replaceable"
    :loading="edit.saving"
    prepend-icon="mdi-swap-horizontal"
    size="small"
    variant="tonal"
    @click="edit.replaceVariant(entry, variant ?? '')"
  >
    Use for {{ role }} instead of {{ variant }}…
  </v-btn>

  <v-menu v-else location="bottom end">
    <template #activator="{ props: menu }">
      <v-btn
        v-bind="menu"
        :loading="edit.saving"
        append-icon="mdi-menu-down"
        size="small"
        variant="tonal"
      >
        {{ entry.skillId ? 'Add' : 'Bind and add' }}
      </v-btn>
    </template>
    <v-list density="compact">
      <v-list-subheader
        :title="`${entry.skillId ? 'Add' : 'Bind and add'} to ${role}`"
      />
      <v-list-item
        v-for="list in lists"
        :key="list.value"
        :disabled="listed === list.value"
        :subtitle="
          listed === list.value ? 'Already listed here' : list.subtitle
        "
        :title="list.title"
        @click="edit.addToRole(entry, list.value)"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SkillList } from '@/api/types'
import { useEditStore } from '@/stores/edit'
import { type CatalogEntry, useLibraryStore } from '@/stores/library'
import { useResolutionStore } from '@/stores/resolution'

const props = defineProps<{ entry: CatalogEntry }>()

const edit = useEditStore()
const library = useLibraryStore()
const resolution = useResolutionStore()

const role = computed(() => resolution.selection.role)
const variant = computed(() => library.listedVariant(props.entry, role.value))
const listed = computed(() => library.listedIn(props.entry, role.value))
const replaceable = computed(
  () =>
    Boolean(variant.value) &&
    props.entry.kind === 'package' &&
    library.packageSkills.includes(variant.value ?? ''),
)

const lists: { value: SkillList; title: string; subtitle: string }[] = [
  { value: 'required', title: 'As required', subtitle: 'Always loaded' },
  {
    value: 'available',
    title: 'As on demand',
    subtitle: 'Loaded when requested',
  },
]
</script>
