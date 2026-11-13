<template>
  <v-dialog
    :model-value="Boolean(pending)"
    max-width="560"
    persistent
    @keydown.esc="settle(false)"
  >
    <v-card v-if="pending" :title="pending.title">
      <v-card-text class="flex flex-col gap-3">
        <p>{{ pending.text }}</p>

        <v-list v-if="pending.items?.length" border density="compact" rounded>
          <v-list-item
            v-for="item in pending.items"
            :key="`${item.title}-${item.subtitle}`"
            :subtitle="item.subtitle"
            :title="item.title"
          />
        </v-list>

        <v-alert
          v-if="pending.alert"
          :text="pending.alert.text"
          :type="pending.alert.type"
          density="compact"
          variant="tonal"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="settle(false)">Cancel</v-btn>
        <v-btn
          :color="pending.destructive ? 'error' : 'primary'"
          variant="flat"
          @click="settle(true)"
        >
          {{ pending.confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'

const { pending, settle } = useConfirm()
</script>
