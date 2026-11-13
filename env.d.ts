/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Visualizer session URL, including the token: http://127.0.0.1:<port>/<token>/ */
  readonly VITE_AP_SESSION_URL?: string
  /** "true" answers API calls from src/fixtures instead of a live server. */
  readonly VITE_AP_FIXTURES?: string
  /** Folder in src/fixtures to answer from; default "default". */
  readonly VITE_AP_FIXTURE_SET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
