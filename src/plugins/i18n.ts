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
    home: {
      title: 'Nothing to show yet',
      text: 'Resolution explorer, skill library and configuration editing will appear here.',
    },
  },
}

export default createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
})
