<template>
  <v-card variant="outlined">
    <v-card-item>
      <v-card-subtitle class="text-xs tracking-wide uppercase">
        Outside the managed total
      </v-card-subtitle>
    </v-card-item>

    <v-list density="compact">
      <v-list-subheader>Project</v-list-subheader>
      <v-list-item
        :title="repositoryPath"
        subtitle="Supplied by host · not measured"
      />
      <v-list-item
        subtitle="Injection behavior is host controlled"
        title="Other project instructions"
      />

      <v-divider class="my-1" />

      <v-list-subheader>Host / bench</v-list-subheader>
      <v-list-item v-for="item in hostItems" :key="item" :title="item">
        <template #append>
          <v-chip label size="x-small">Unobserved</v-chip>
        </template>
      </v-list-item>
    </v-list>

    <v-card-text class="text-sm text-on-surface/70">
      Unknown does not mean zero. This view measures additional instruction
      bodies, not the agent's complete context window.
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{ repositoryPath: string }>()

const hostItems = [
  'System instructions',
  'Built-in tools',
  'Built-in skills',
  'Other runtime context',
]
</script>
