import type { FileStatus } from '@/api/types'

export const statusColor: Record<FileStatus, string | undefined> = {
  same: undefined,
  changed: 'warning',
  added: 'success',
  removed: 'error',
}
