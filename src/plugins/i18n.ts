import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    app: {
      title: 'Agent Profiles Visualizer',
    },
    theme: {
      label: 'Theme',
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
  },
}

export default createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
})
