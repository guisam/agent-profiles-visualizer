<template>
  <v-container class="flex flex-col gap-4 py-6" fluid>
    <v-card variant="flat">
      <v-card-text>
        <SelectorBar />
      </v-card-text>
    </v-card>

    <v-banner
      v-if="store.notices.length"
      color="warning"
      icon="mdi-alert-circle-outline"
      lines="two"
      rounded
      border
    >
      <v-banner-text>{{ store.notices.join(' ') }}</v-banner-text>
      <template #actions>
        <v-btn @click="store.notices = []">Dismiss</v-btn>
      </template>
    </v-banner>

    <v-alert
      v-if="store.error"
      title="Unable to resolve"
      type="error"
      variant="tonal"
    >
      <p class="whitespace-pre-wrap">{{ store.error }}</p>
      <p v-if="!fixtureMode" class="mt-2 text-sm">
        Fix the configuration or change the selection, then use Refresh files to
        retry.
      </p>
    </v-alert>

    <template v-if="result">
      <TotalsCards :result="result" />

      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <v-card :loading="store.loading" variant="outlined">
          <v-card-item>
            <v-card-title>Instruction composition</v-card-title>
            <v-card-subtitle class="text-wrap">{{ routing }}</v-card-subtitle>
            <template #append>
              <v-btn
                :disabled="store.loading"
                prepend-icon="mdi-pin-outline"
                variant="tonal"
                @click="store.pin()"
              >
                {{ store.pinned ? 'Pin again' : 'Pin for comparison' }}
              </v-btn>
            </template>
          </v-card-item>

          <v-card-text class="flex flex-col gap-4">
            <CompositionLayers :result="result" />
            <div class="grid gap-4 md:grid-cols-2">
              <SkillListCard list="required" :result="result" />
              <SkillListCard list="available" :result="result" />
            </div>
          </v-card-text>
        </v-card>

        <aside aria-label="Accounting boundaries">
          <AccountingCard
            :repository-path="result.diagnostics.repository.path"
          />
        </aside>
      </div>

      <PinnedComparison
        v-if="store.pinned"
        :current="result"
        :pinned="store.pinned"
        @clear="store.clearPin()"
      />
    </template>

    <v-skeleton-loader v-else-if="!store.error" type="card, article, article" />

    <footer class="py-4 text-center text-xs text-on-surface/70">
      Exact UTF-8 bytes · Unicode code points · Tokens not calculated<br>
      Excludes bootstrap instructions, inventory rendering, and output
      formatting. No telemetry or uploads.
    </footer>
  </v-container>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { fixtureMode } from '@/api/client'
import AccountingCard from '@/components/resolution/AccountingCard.vue'
import CompositionLayers from '@/components/resolution/CompositionLayers.vue'
import PinnedComparison from '@/components/resolution/PinnedComparison.vue'
import SelectorBar from '@/components/resolution/SelectorBar.vue'
import SkillListCard from '@/components/resolution/SkillListCard.vue'
import TotalsCards from '@/components/resolution/TotalsCards.vue'
import { useResolutionStore } from '@/stores/resolution'

const store = useResolutionStore()
const result = computed(() => store.result)

const routing = computed(() => {
  const value = result.value
  if (!value) return ''
  const rule = value.matchedBy.startsWith('family')
    ? `: ${value.family}`
    : value.matchedBy === 'alias'
      ? ` of ${value.identity.canonical}`
      : ''
  return `${value.host ?? 'Unspecified host'} / ${value.model ?? 'Unspecified model'} → ${value.profile} (matched by ${value.matchedBy}${rule}) · Role: ${value.role}`
})
</script>
