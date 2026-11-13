<template>
  <v-container class="flex flex-col gap-4 py-6" fluid>
    <v-card variant="flat">
      <v-card-item>
        <v-card-title>Compare skills</v-card-title>
        <v-card-subtitle class="text-wrap">
          Any two entries: two versions of one package, differently named
          packages, or a project-local skill. Comparison never changes
          configuration, pins, locks or skill files.
        </v-card-subtitle>
      </v-card-item>

      <v-card-text>
        <div class="grid items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <v-autocomplete
            v-model="compare.left"
            :items="choices"
            :loading="library.loading"
            density="comfortable"
            hide-details
            label="Left"
            variant="outlined"
          />
          <v-btn
            aria-label="Swap left and right"
            class="justify-self-center"
            icon="mdi-swap-horizontal"
            variant="text"
            @click="swap"
          />
          <v-autocomplete
            v-model="compare.right"
            :items="choices"
            :loading="library.loading"
            density="comfortable"
            hide-details
            label="Right"
            variant="outlined"
          />
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <v-btn-toggle
            v-model="compare.view"
            color="primary"
            density="comfortable"
            divided
            mandatory
            variant="outlined"
          >
            <v-btn prepend-icon="mdi-file-compare" value="unified">
              Unified changes
            </v-btn>
            <v-btn prepend-icon="mdi-view-split-vertical" value="side">
              Side by side, full files
            </v-btn>
          </v-btn-toggle>
          <v-spacer />
          <v-btn
            :disabled="!compare.left || !compare.right"
            :loading="compare.loading"
            color="primary"
            prepend-icon="mdi-compare-horizontal"
            variant="flat"
            @click="compare.run()"
          >
            Compare skills
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-alert
      v-if="compare.error"
      title="Comparison failed"
      type="error"
      variant="tonal"
    >
      {{ compare.error }}
    </v-alert>

    <template v-if="result">
      <div class="grid gap-4 md:grid-cols-2">
        <SkillSideCard :side="result.left" title="Left" />
        <SkillSideCard :side="result.right" title="Right" />
      </div>

      <section class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-medium">Files</h2>
          <v-chip
            v-for="(count, status) in statusCounts"
            :key="status"
            :color="statusColor[status]"
            label
            size="small"
            variant="tonal"
          >
            {{ count }} {{ status }}
          </v-chip>
        </div>

        <v-alert
          v-if="result.identical"
          density="compact"
          text="No file differences."
          type="info"
          variant="tonal"
        />

        <v-expansion-panels
          v-if="compare.view === 'unified'"
          :key="`unified-${resultKey}`"
          multiple
          variant="accordion"
        >
          <v-expansion-panel v-for="file in result.files" :key="file.path">
            <v-expansion-panel-title>
              <FileTitle :path="file.path" :status="file.status" />
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p v-if="file.diff === null" class="text-sm text-on-surface/70">
                Binary file: contents not shown.
              </p>
              <UnifiedDiff v-else :diff="file.diff" />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Side by side: every file, unchanged ones collapsed. -->
        <v-expansion-panels
          v-else
          :key="`side-${resultKey}`"
          v-model="openSidePanels"
          multiple
          variant="accordion"
        >
          <v-expansion-panel
            v-for="file in result.aligned"
            :key="file.path"
            :value="file.path"
          >
            <v-expansion-panel-title>
              <FileTitle :path="file.path" :status="file.status" />
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p v-if="file.rows === null" class="text-sm text-on-surface/70">
                Binary file: contents not shown.
              </p>
              <SideBySideDiff v-else :rows="file.rows" />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </section>
    </template>

    <v-empty-state
      v-else-if="!compare.loading && !compare.error"
      icon="mdi-compare-horizontal"
      text="Choose two skills and select Compare skills, or pick two rows on the Skills tab."
      title="Nothing compared yet"
    />
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { FileStatus } from '@/api/types'
import FileTitle from '@/components/compare/FileTitle.vue'
import SideBySideDiff from '@/components/compare/SideBySideDiff.vue'
import SkillSideCard from '@/components/compare/SkillSideCard.vue'
import { statusColor } from '@/components/compare/status'
import UnifiedDiff from '@/components/compare/UnifiedDiff.vue'
import { useCompareStore } from '@/stores/compare'
import { entryLabel, useLibraryStore } from '@/stores/library'

const compare = useCompareStore()
const library = useLibraryStore()

const result = computed(() => compare.result)
const resultKey = computed(() =>
  result.value ? `${result.value.left.name}-${result.value.right.name}` : '',
)

const choices = computed(() =>
  library.entries
    .filter((entry) => entry.selectable)
    .map((entry) => ({ title: entryLabel(entry), value: entry.selector })),
)

const statusCounts = computed(() => {
  const counts: Partial<Record<FileStatus, number>> = {}
  for (const file of result.value?.aligned ?? [])
    counts[file.status] = (counts[file.status] ?? 0) + 1
  return counts
})

const openSidePanels = ref<string[]>([])
watch(
  result,
  (value) => {
    openSidePanels.value = (value?.aligned ?? [])
      .filter((file) => file.status !== 'same')
      .map((file) => file.path)
  },
  { immediate: true },
)

function swap() {
  compare.swap()
  if (compare.result) compare.run()
}

onMounted(async () => {
  if (!library.data) await library.load()
  // Default to the first two entries, as the prototype does.
  compare.left ??= choices.value[0]?.value ?? null
  compare.right ??= choices.value[1]?.value ?? null
})
</script>
