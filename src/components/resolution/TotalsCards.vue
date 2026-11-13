<template>
  <section aria-label="Context totals" class="grid gap-3 md:grid-cols-3">
    <v-card color="primary" variant="tonal">
      <v-card-item>
        <v-card-subtitle>Managed instruction context</v-card-subtitle>
        <v-card-title class="text-3xl">{{
          bytes(managed.total.bytes)
        }}</v-card-title>
      </v-card-item>
      <v-card-text>
        {{ managed.total.characters.toLocaleString('en-US') }}
        characters ·
        {{ managed.total.files }}
        instruction entries
      </v-card-text>
    </v-card>

    <v-card variant="outlined">
      <v-card-item>
        <v-card-subtitle>Available, not injected</v-card-subtitle>
        <v-card-title class="text-3xl">{{
          bytes(available.bytes)
        }}</v-card-title>
      </v-card-item>
      <v-card-text>Potential additional instruction context</v-card-text>
    </v-card>

    <v-card variant="outlined">
      <v-card-item>
        <v-card-subtitle>Host / bench context</v-card-subtitle>
        <!-- Unknown is never displayed as zero. -->
        <div class="py-1">
          <v-chip label prepend-icon="mdi-eye-off-outline">Unobserved</v-chip>
        </div>
      </v-card-item>
      <v-card-text>Outside Agent Profiles accounting</v-card-text>
    </v-card>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Resolution } from '@/api/types'
import { bytes } from '@/utils/format'

const props = defineProps<{ result: Resolution }>()

const managed = computed(() => props.result.diagnostics.managed)
const available = computed(() => props.result.diagnostics.availableNotLoaded)
</script>
