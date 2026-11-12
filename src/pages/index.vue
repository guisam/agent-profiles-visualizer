<template>
  <v-container class="py-8">
    <v-empty-state
      icon="mdi-graph-outline"
      :text="t('home.text')"
      :title="t('home.title')"
    />
  </v-container>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
