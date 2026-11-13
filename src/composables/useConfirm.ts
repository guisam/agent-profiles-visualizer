/**
 * One confirmation dialog for every delete or replacement (ConfirmDialog.vue,
 * mounted once in App.vue). `confirm()` resolves true only when the person
 * selects the confirm button; closing or cancelling resolves false.
 */

import { shallowRef } from 'vue'

export interface ConfirmOptions {
  title: string
  text: string
  /** Facts shown as a list, such as each edit and its file. */
  items?: { title: string; subtitle?: string }[]
  /** A highlighted note, such as evidence or a trust warning. */
  alert?: { type: 'info' | 'warning' | 'error'; text: string }
  confirmText: string
  /** Shows the confirm button in the error color. */
  destructive?: boolean
}

interface Pending extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

const pending = shallowRef<Pending | null>(null)

export function useConfirm() {
  function confirm(options: ConfirmOptions) {
    pending.value?.resolve(false)
    return new Promise<boolean>((resolve) => {
      pending.value = { ...options, resolve }
    })
  }

  function settle(confirmed: boolean) {
    pending.value?.resolve(confirmed)
    pending.value = null
  }

  return { pending, confirm, settle }
}
