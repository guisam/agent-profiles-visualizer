<template>
  <v-tooltip :text="copied ? 'Copied' : label" location="top">
    <template #activator="{ props: tooltip }">
      <v-btn
        v-bind="tooltip"
        :aria-label="label"
        :icon="copied ? 'mdi-check' : 'mdi-content-copy'"
        density="comfortable"
        size="x-small"
        variant="text"
        @click.stop="copy"
      />
    </template>
  </v-tooltip>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{ text: string; label?: string }>(), {
  label: 'Copy',
})

const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    // Clipboard access can be denied; the text stays selectable.
  }
}
</script>
