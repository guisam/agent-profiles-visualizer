import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemePreference = 'system' | 'light' | 'dark'

const THEME_KEY = 'agent-profiles-visualizer:theme'

function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
  return 'system'
}

export const useAppStore = defineStore('app', () => {
  const themePreference = ref<ThemePreference>(readThemePreference())

  watch(themePreference, (value) => {
    try {
      localStorage.setItem(THEME_KEY, value)
    } catch {
      // Ignore: the preference still applies for this session.
    }
  })

  return { themePreference }
})
