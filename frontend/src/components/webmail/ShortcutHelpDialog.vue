<template>
  <v-dialog
    :model-value="modelValue"
    max-width="560"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-keyboard-outline" class="mr-2" />
        {{ $gettext('Keyboard shortcuts') }}
      </v-card-title>
      <v-card-text>
        <table class="shortcut-table">
          <tbody>
            <tr v-for="binding in bindings" :key="binding.keys.join()">
              <td class="shortcut-table__keys">
                <template v-for="(key, i) in binding.keys" :key="key">
                  <span v-if="i > 0" class="shortcut-table__or">
                    {{ $gettext('or') }}
                  </span>
                  <kbd>{{ keyLabel(key) }}</kbd>
                </template>
              </td>
              <td class="shortcut-table__desc">{{ binding.description }}</td>
            </tr>
          </tbody>
        </table>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          :text="$gettext('Close')"
          @click="emit('update:modelValue', false)"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useGettext } from 'vue3-gettext'

const { $gettext } = useGettext()

defineProps({
  modelValue: { type: Boolean, default: false },
  // [{ keys: ['j'], description: '...' }]
  bindings: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const keyLabel = (key) => {
  if (key === ' ') {
    return $gettext('Space')
  }
  return key.length === 1 ? key : key
}
</script>

<style scoped>
.shortcut-table {
  width: 100%;
  border-collapse: collapse;
}
.shortcut-table tr {
  border-bottom: 1px solid var(--line);
}
.shortcut-table tr:last-child {
  border-bottom: 0;
}
.shortcut-table td {
  padding: 8px 4px;
  vertical-align: middle;
}
.shortcut-table__keys {
  width: 130px;
  white-space: nowrap;
}
.shortcut-table__or {
  margin: 0 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--fg-mute);
  text-transform: uppercase;
}
kbd {
  display: inline-block;
  min-width: 24px;
  padding: 2px 7px;
  border: 1px solid var(--line-2);
  border-radius: 0;
  background: var(--bg-2);
  font-family: var(--font-mono);
  font-size: 12px;
  text-align: center;
  color: var(--fg);
}
.shortcut-table__desc {
  font-size: 13px;
  color: var(--fg-dim);
}
</style>
