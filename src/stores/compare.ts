/** Skill-vs-skill comparison. */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api/client'
import type { CompareResponse } from '@/api/types'
import { useAppStore } from './app'

export type CompareView = 'unified' | 'side'

export const useCompareStore = defineStore('compare', () => {
  const app = useAppStore()
  const left = ref<string | null>(null)
  const right = ref<string | null>(null)
  const view = ref<CompareView>('unified')
  const result = ref<CompareResponse | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function run() {
    if (!left.value || !right.value) return
    loading.value = true
    try {
      result.value = await app.track(api.compare(left.value, right.value))
      error.value = null
    } catch (caught) {
      result.value = null
      error.value = caught instanceof Error ? caught.message : String(caught)
    } finally {
      loading.value = false
    }
  }

  function swap() {
    ;[left.value, right.value] = [right.value, left.value]
  }

  return { left, right, view, result, error, loading, run, swap }
})
