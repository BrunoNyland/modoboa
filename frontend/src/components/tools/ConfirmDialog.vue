<template>
  <v-dialog
    v-model="dialog"
    :max-width="options.width"
    :z-index="options.zIndex"
    @keydown.esc="cancel"
  >
    <v-card>
      <v-card-title class="text-h6 px-6 pt-6 pb-2">
        {{ title }}
      </v-card-title>
      <v-card-text v-show="!!message" class="text-body-1 px-6 py-2">
        {{ message }}
        <slot></slot>
      </v-card-text>
      <v-card-actions class="px-6 pb-6 pt-2">
        <v-spacer></v-spacer>
        <v-btn v-if="!options.noconfirm" variant="text" @click="cancel">
          {{ options.cancelLabel }}
        </v-btn>
        <v-btn :color="options.color" variant="flat" @click="agree">
          {{ options.agreeLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useGettext } from 'vue3-gettext'

const { $gettext } = useGettext()

const props = defineProps({
  // the callback should return true or false, returning false inhibits the close event
  callback_agree: {
    type: Function,
    default: null,
  },
})

const dialog = ref(false)
const message = ref('')
const title = ref('')
let storedResolve

const options = ref({
  color: 'primary',
  width: 400,
  zIndex: 2400,
  noconfirm: false,
  cancelLabel: $gettext('Cancel'),
  agreeLabel: $gettext('OK'),
})

function open(_title, _message, _options) {
  dialog.value = true
  title.value = _title
  message.value = _message
  options.value = Object.assign(options.value, _options)
  return new Promise((resolve) => {
    storedResolve = resolve
  })
}
defineExpose({
  open,
})

async function agree() {
  if (props.callback_agree !== null && !(await props.callback_agree())) {
    return
  }
  storedResolve(true)
  dialog.value = false
}

function cancel() {
  storedResolve(false)
  dialog.value = false
}
</script>
