<template>
  <div class="flex flex-col gap-3">
    <p class="text-sm">{{ sizeText }}</p>
    <p class="text-sm text-on-surface/70">{{ provenance }}</p>

    <div class="flex items-start gap-1">
      <v-code class="text-xs break-all">{{ location }}</v-code>
      <CopyButton :text="location" label="Copy location" />
    </div>

    <p v-if="entry.description" class="text-sm text-on-surface/70">
      {{ entry.description }}
    </p>
    <p v-if="entry.resources?.length" class="text-sm text-on-surface/70">
      Declared resources (not injected): {{ entry.resources.join(', ') }}
    </p>

    <!-- Instruction text is always plain text: never v-html or Markdown. -->
    <v-sheet
      v-if="content !== undefined"
      border
      class="max-h-96 overflow-auto p-3"
      rounded
    >
      <pre class="font-mono text-xs whitespace-pre-wrap" v-text="content" />
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LoadedEntry, SkillEntry } from '@/api/types'
import CopyButton from '@/components/CopyButton.vue'
import { size } from '@/utils/format'

const props = defineProps<{
  entry: SkillEntry | LoadedEntry
  provenance: string
}>()

const isHost = computed(() => props.entry.type === 'host')

const content = computed(() =>
  'content' in props.entry ? props.entry.content : undefined,
)

const location = computed(() => {
  const { entry } = props
  if (entry.package) {
    const pkg = entry.package
    return `${pkg.binding}: ${pkg.name}@${pkg.version} sha256:${pkg.sha256}${
      pkg.revisionDigest ? ` revision:${pkg.revisionDigest}` : ''
    } (${pkg.selectedBy})${entry.binding && entry.backing ? ` · ${entry.backing.path}` : ''}`
  }
  return entry.path ?? `${entry.host}: ${entry.hostId}`
})

const sizeText = computed(() => {
  const { entry } = props
  // Package integrity does not establish a host-visible invocation address.
  if (isHost.value)
    return entry.package
      ? `Supported hosts: ${entry.supportedHosts?.join(', ')}; host-visible address unavailable; invocation unverified · bytes not counted`
      : `${entry.host} skill ${entry.hostId} · ${entry.verification} · bytes not counted`
  return entry.bytes === undefined
    ? 'Size not reported'
    : size({ bytes: entry.bytes, characters: entry.characters ?? 0 })
})
</script>
