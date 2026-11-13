<template>
  <v-dialog v-model="open" max-width="600">
    <v-card title="Add to configuration">
      <v-form ref="form" @submit.prevent="submit">
        <v-card-text class="flex flex-col gap-4">
          <v-btn-toggle
            v-model="kind"
            color="primary"
            density="comfortable"
            divided
            mandatory
            variant="outlined"
          >
            <v-btn value="model">Model</v-btn>
            <v-btn value="family">Family</v-btn>
            <v-btn value="role">Role</v-btn>
          </v-btn-toggle>

          <p class="text-sm text-on-surface/70">{{ help.intro }}</p>

          <v-text-field
            v-model="id"
            :hint="help.id"
            :placeholder="help.placeholder"
            :rules="[required, noSpaces]"
            autocomplete="off"
            label="ID"
            persistent-hint
            spellcheck="false"
            variant="outlined"
          />

          <v-select
            v-if="kind !== 'role'"
            v-model="profile"
            :hint="help.profile"
            :items="profiles"
            :rules="[required]"
            label="Profile"
            persistent-hint
            variant="outlined"
          />

          <v-text-field
            v-if="kind === 'family'"
            v-model="prefixes"
            :hint="familyHelp.prefixes"
            autocomplete="off"
            label="Prefixes (optional)"
            persistent-hint
            placeholder="claude-opus-, claude-opus"
            spellcheck="false"
            variant="outlined"
          />

          <v-text-field
            v-if="kind === 'role'"
            v-model="description"
            :hint="roleHelp.description"
            autocomplete="off"
            label="Description (optional)"
            persistent-hint
            placeholder="Reviews pull requests for security issues"
            variant="outlined"
          />

          <p class="text-xs text-on-surface/70">
            Models, families and roles go to the project agents.yaml, and locks
            are refreshed. Hosts are built into Agent Profiles and cannot be
            added.
          </p>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="open = false">Cancel</v-btn>
          <v-btn
            :loading="edit.saving"
            color="primary"
            type="submit"
            variant="flat"
          >
            Add {{ kind }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useEditStore } from '@/stores/edit'
import { useResolutionStore } from '@/stores/resolution'

const open = defineModel<boolean>({ default: false })

const edit = useEditStore()
const resolution = useResolutionStore()

type Kind = 'model' | 'family' | 'role'

const kind = ref<Kind>('model')
const id = ref('')
const profile = ref<string | null>(null)
const prefixes = ref('')
const description = ref('')
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)

const profiles = computed(() => resolution.editing?.profiles ?? [])

watch(open, (value) => {
  if (value && !profile.value) profile.value = profiles.value[0] ?? null
})

const required = (value: string | null) => Boolean(value?.trim()) || 'Required'
const noSpaces = (value: string) => !/\s/.test(value.trim()) || 'No spaces'

const familyHelp = {
  prefixes:
    'Comma-separated starts of model IDs that belong to the family, such as claude-opus-. A model whose ID starts with one is routed here automatically; the longest matching prefix wins. Leave it empty to use the family only when it is chosen explicitly.',
}
const roleHelp = {
  description:
    'The first text of the new instruction file, .agent-profiles/roles/<ID>.md. Edit that file afterwards to write the full role instructions.',
}

const helpByKind = {
  model: {
    intro:
      'A model entry gives one exact model ID its own profile. When an agent resolves with this ID, it gets that profile’s instructions, before any family fallback is tried.',
    placeholder: 'claude-opus-5-5',
    id: 'The exact model ID your host reports, such as claude-opus-5-5. It must match exactly.',
    profile: 'The per-model instruction layer this model uses, from profiles.',
  },
  family: {
    intro:
      'A family gives a group of related models one profile. It applies only to models without their own exact entry: when the family is chosen as Family fallback, or when a model ID starts with one of its prefixes.',
    placeholder: 'claude-opus',
    id: 'A short name for the family: lowercase letters, digits and hyphens.',
    profile: 'The model profile every model in this family uses.',
  },
  role: {
    intro:
      'A role is the job an agent does, such as implementer or reviewer. It adds its own instructions and decides which skills are required and which are on demand. A new role starts with no skills; add them from the skill library.',
    placeholder: 'security-reviewer',
    id: 'The role name agents and the Role selector use: lowercase letters, digits and hyphens.',
    profile: '',
  },
}

const help = computed(() => helpByKind[kind.value])

async function submit() {
  const checked = await form.value?.validate()
  if (!checked?.valid) return
  const value = id.value.trim()
  const added =
    kind.value === 'role'
      ? await edit.addConfig({
          action: 'add-role',
          id: value,
          ...(description.value.trim()
            ? { description: description.value.trim() }
            : {}),
        })
      : await edit.addConfig({
          action: kind.value === 'model' ? 'add-model' : 'add-family',
          id: value,
          profile: profile.value ?? '',
          ...(kind.value === 'family'
            ? {
                prefixes: prefixes.value
                  .split(',')
                  .map((prefix) => prefix.trim())
                  .filter(Boolean),
              }
            : {}),
        })
  if (added) {
    id.value = ''
    prefixes.value = ''
    description.value = ''
    open.value = false
  }
}
</script>
