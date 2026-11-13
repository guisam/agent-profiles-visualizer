<template>
  <v-app>
    <v-app-bar border="b" elevation="0" :loading="app.busy">
      <template #prepend>
        <v-icon class="ml-2" color="primary" icon="mdi-graph-outline" />
      </template>

      <v-app-bar-title>{{ t('app.title') }}</v-app-bar-title>

      <template #append>
        <div class="flex items-center gap-1">
          <v-chip
            v-if="fixtureMode"
            class="mr-1 hidden sm:flex"
            color="info"
            label
            prepend-icon="mdi-database-outline"
            size="small"
          >
            Fixtures
          </v-chip>
          <v-chip
            v-if="resolution.config"
            :color="resolution.editing ? 'warning' : undefined"
            :prepend-icon="
              resolution.editing ? 'mdi-pencil' : 'mdi-lock-outline'
            "
            class="mr-1"
            label
            size="small"
          >
            {{ resolution.editing ? 'Edits on' : 'Read only' }}
          </v-chip>

          <v-tooltip
            v-if="resolution.editing"
            location="bottom"
            text="Add to configuration"
          >
            <template #activator="{ props: tooltip }">
              <v-btn
                v-bind="tooltip"
                aria-label="Add to configuration"
                icon="mdi-plus-box-outline"
                @click="addOpen = true"
              />
            </template>
          </v-tooltip>

          <v-tooltip
            location="bottom"
            max-width="320"
            text="Refresh files: reread configuration, instructions, locks and trust policy"
          >
            <template #activator="{ props: tooltip }">
              <v-btn
                v-bind="tooltip"
                aria-label="Refresh files"
                :disabled="app.busy"
                icon="mdi-refresh"
                @click="refresh"
              />
            </template>
          </v-tooltip>

          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                :aria-label="t('theme.label')"
                :icon="themeIcons[app.themePreference]"
              />
            </template>

            <v-list
              v-model:selected="selectedTheme"
              density="compact"
              mandatory
            >
              <v-list-item
                v-for="option in themeOptions"
                :key="option"
                :prepend-icon="themeIcons[option]"
                :title="t(`theme.${option}`)"
                :value="option"
              />
            </v-list>
          </v-menu>
        </div>
      </template>

      <template #extension>
        <v-tabs color="primary">
          <v-tab exact prepend-icon="mdi-layers-outline" to="/"
            >Resolution</v-tab
          >
          <v-tab exact prepend-icon="mdi-bookshelf" to="/skills">Skills</v-tab>
          <v-tab prepend-icon="mdi-compare-horizontal" to="/skills/compare">
            Compare
          </v-tab>
        </v-tabs>
      </template>
    </v-app-bar>

    <v-main>
      <v-container v-if="edit.error" class="pb-0" fluid>
        <v-alert
          closable
          title="The edit was not saved"
          type="error"
          variant="tonal"
          @click:close="edit.error = null"
        >
          {{ edit.error.text }}
          <template v-if="edit.error.conflict" #append>
            <v-btn variant="tonal" @click="refresh">Refresh files</v-btn>
          </template>
        </v-alert>
      </v-container>

      <router-view />
    </v-main>

    <ConfirmDialog />
    <AddConfigDialog v-model="addOpen" />
    <v-snackbar-queue v-model="app.toasts" location="bottom end" />
  </v-app>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import { fixtureMode } from '@/api/client'
import AddConfigDialog from '@/components/AddConfigDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { type ThemePreference, useAppStore } from '@/stores/app'
import { useEditStore } from '@/stores/edit'
import { useLibraryStore } from '@/stores/library'
import { useResolutionStore } from '@/stores/resolution'

const { t } = useI18n()
const theme = useTheme()
const app = useAppStore()
const resolution = useResolutionStore()
const library = useLibraryStore()
const edit = useEditStore()

const addOpen = ref(false)

const themeOptions: ThemePreference[] = ['system', 'light', 'dark']
const themeIcons: Record<ThemePreference, string> = {
  system: 'mdi-theme-light-dark',
  light: 'mdi-white-balance-sunny',
  dark: 'mdi-weather-night',
}

const selectedTheme = computed<ThemePreference[]>({
  get: () => [app.themePreference],
  set: ([value]) => {
    if (value) app.themePreference = value
  },
})

watch(
  () => app.themePreference,
  (value) => theme.change(value),
  { immediate: true },
)

/** Reread everything from disk; there is no polling or file watching. */
async function refresh() {
  edit.error = null
  await Promise.all([resolution.initialize(), library.refresh()])
}

onMounted(() => resolution.initialize(true))
</script>
