/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com
 */

import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

/**
 * `agent-profiles visualize` sends `style-src 'self' 'nonce-<nonce>'` and puts
 * the nonce in `<meta name="csp-nonce">`. Vuetify adds it to its theme
 * `<style>` element, which the policy would otherwise block.
 */
const cspNonce =
  document
    .querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')
    ?.content.trim() || undefined

export default createVuetify({
  theme: {
    defaultTheme: 'system',
    utilities: false,
    cspNonce,
  },
  display: {
    mobileBreakpoint: 'md',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 840,
      lg: 1145,
      xl: 1545,
      xxl: 2138,
    },
  },
})
