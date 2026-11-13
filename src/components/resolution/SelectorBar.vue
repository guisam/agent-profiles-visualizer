<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <template v-for="field in fields" :key="field.key">
      <!-- Any model ID can be typed: unconfigured models resolve through the fallbacks. -->
      <v-combobox
        v-if="field.key === 'model'"
        v-model="modelDraft"
        clearable
        :disabled="!store.config"
        :items="store.choices('model')"
        :label="field.label"
        :placeholder="modelPlaceholder"
        density="comfortable"
        hide-details
        persistent-placeholder
        variant="outlined"
        @blur="commitModel"
        @keydown.enter="commitModel"
        @update:menu="(open: boolean) => open || commitModel()"
      >
        <template #append-inner>
          <SelectorHelp :field="field" />
        </template>
      </v-combobox>
      <v-select
        v-else
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
          <SelectorHelp :field="field" />
        </template>
      </v-select>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from 'vue'
import { VIcon, VTooltip } from 'vuetify/components'
import { type SelectorKey, useResolutionStore } from '@/stores/resolution'

interface Field {
  key: SelectorKey
  label: string
  placeholder: string
  help: string
}

const store = useResolutionStore()

const fields: Field[] = [
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
    help: 'The exact model ID the agent runs as. Pick a configured model or type any ID and press Enter. An exact entry under models: (or an alias) picks the model profile. A model with no exact entry falls back to Family fallback, then a configured family prefix, then the default profile.',
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

const modelPlaceholder = computed(() =>
  store.config && !store.config.models.length
    ? 'No models configured: type a model ID'
    : 'Unspecified model (use fallback)',
)

// The combobox updates on every keystroke; resolve only once the ID is committed.
const modelDraft = ref<string | null>(store.selection.model)
watch(
  () => store.selection.model,
  (value) => {
    modelDraft.value = value
  },
)

function commitModel() {
  const value = modelDraft.value?.trim() || null
  if (value !== store.selection.model) store.select('model', value)
}

// Commit a pick from the list or a clear at once; typed text waits for Enter or blur.
watch(modelDraft, (value) => {
  if (!value || store.choices('model').includes(value)) commitModel()
})

const SelectorHelp = defineComponent({
  props: { field: { type: Object as () => Field, required: true } },
  setup(props) {
    return () =>
      h(
        VTooltip,
        { location: 'bottom', maxWidth: 360, text: props.field.help },
        {
          activator: ({ props: tooltip }: { props: Record<string, unknown> }) =>
            h(VIcon, {
              ...tooltip,
              'aria-label': `About ${props.field.label}`,
              icon: 'mdi-information-outline',
              size: 'small',
              onMousedown: (event: Event) => event.stopPropagation(),
            }),
        },
      )
  },
})
</script>
