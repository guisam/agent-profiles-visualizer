/** Exact byte counts; tokens are never estimated. */
export const bytes = (value: number) => `${value.toLocaleString('en-US')} B`

export const size = (entry: { bytes: number; characters: number }) =>
  `${bytes(entry.bytes)} · ${entry.characters.toLocaleString('en-US')} characters`

/** Signed byte change, such as +120 B or -40 B. */
export const byteChange = (value: number) =>
  `${value > 0 ? '+' : ''}${bytes(value)}`

/** Abbreviated digests carry an explicit marker; the full value is shown elsewhere. */
export const shortDigest = (digest: string | null | undefined) =>
  digest ? `sha256:${digest.slice(0, 12)}…` : 'unavailable'

export const usageText = (use: { role: string; list: string }) =>
  `${use.role} (${use.list === 'required' ? 'required' : 'on demand'})`
