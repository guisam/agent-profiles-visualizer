<template>
  <v-app>
    <v-app-bar border="b" elevation="0">
      <template #prepend>
        <v-icon class="ml-2" color="primary" icon="mdi-graph-outline" />
      </template>

      <v-app-bar-title>{{ t('app.title') }}</v-app-bar-title>

      <template #append>
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              :aria-label="t('theme.label')"
              :icon="themeIcons[app.themePreference]"
            />
          </template>

          <v-list v-model:selected="selectedTheme" density="compact" mandatory>
            <v-list-item
              v-for="option in themeOptions"
              :key="option"
              :prepend-icon="themeIcons[option]"
              :title="t(`theme.${option}`)"
              :value="option"
            />
          </v-list>
        </v-menu>
      </template>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import { type ThemePreference, useAppStore } from '@/stores/app'

const { t } = useI18n()
const theme = useTheme()
const app = useAppStore()

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
</script>
