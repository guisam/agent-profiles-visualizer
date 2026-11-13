import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

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

export interface Toast {
  text: string
  color?: 'success' | 'error' | 'info'
  timeout?: number
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

  /** API calls in flight; drives the app bar progress bar. */
  const pending = ref(0)
  const busy = computed(() => pending.value > 0)

  async function track<T>(work: Promise<T>): Promise<T> {
    pending.value++
    try {
      return await work
    } finally {
      pending.value--
    }
  }

  /** Messages for v-snackbar-queue. */
  const toasts = ref<Toast[]>([])

  function notify(text: string, color: Toast['color'] = 'success') {
    toasts.value.push({ text, color, timeout: color === 'error' ? -1 : 5000 })
  }

  return { themePreference, busy, track, toasts, notify }
})
