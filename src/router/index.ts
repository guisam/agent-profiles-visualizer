/**
 * router/index.ts
 *
 * Routes are generated from the files in ./src/pages by the vue-router Vite plugin.
 * Hash history: the visualizer server serves only known files under its session
 * URL, so path-based deep links would not survive a reload.
 */

import { createRouter, createWebHashHistory } from 'vue-router'
import { handleHotUpdate, routes } from 'vue-router/auto-routes'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

if (import.meta.hot) {
  handleHotUpdate(router)
}

export default router
