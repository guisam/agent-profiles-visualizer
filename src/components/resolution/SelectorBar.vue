<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <v-select
      v-for="field in fields"
      :key="field.key"
      :clearable="field.key !== 'role'"
      :disabled="!store.config"
      :items="store.choices(field.key)"
      :label="field.label"
      :model-value="store.selection[field.key]"
      :placeholder="field.placeholder"
      density="comfortable"
      hide-details
      persistent-placeholder
      variant="outlined"
      @update:model-value="
        (value: string | null) => store.select(field.key, value)
      "
    >
      <template #append-inner>
        <v-tooltip location="bottom" max-width="360" :text="field.help">
          <template #activator="{ props: tooltip }">
            <v-icon
              v-bind="tooltip"
              :aria-label="`About ${field.label}`"
              icon="mdi-information-outline"
              size="small"
              @mousedown.stop
            />
          </template>
        </v-tooltip>
      </template>
    </v-select>
  </div>
</template>

<script setup lang="ts">
import { type SelectorKey, useResolutionStore } from '@/stores/resolution'

const store = useResolutionStore()

const fields: {
  key: SelectorKey
  label: string
  placeholder: string
  help: string
}[] = [
  {
    key: 'host',
    label: 'Host',
    placeholder: 'Unspecified host',
    help: 'The agent application that will load these instructions, such as Claude Code or Codex. Assignments can target a host, so changing it can change which skill versions are selected. Hosts are built into Agent Profiles, not configured.',
  },
  {
    key: 'model',
    label: 'Model',
    placeholder: 'Unspecified model (use fallback)',
    help: 'The exact model ID the agent runs as. An exact entry under models: (or an alias) picks the model profile. A model with no exact entry falls back to Family fallback, then a configured family prefix, then the default profile.',
  },
  {
    key: 'family',
    label: 'Family fallback',
    placeholder: 'No family fallback',
    help: 'Only used when the model has no exact entry or alias under models:. Names a family from families: whose profile then applies. When left empty, the longest family prefix of the model ID is tried, then the default profile. It never overrides an exact model match.',
  },
  {
    key: 'role',
    label: 'Role',
    placeholder: 'Default role',
    help: 'The job the agent is doing, such as implementer or reviewer. The role adds its own instructions and decides which skills are required (always loaded) and which are available on demand.',
  },
]
</script>
