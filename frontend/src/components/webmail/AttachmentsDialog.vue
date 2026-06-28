<template>
  <v-card class="attachments-card">
    <div class="dialog-head">
      <p class="eyebrow">{{ $gettext('Compose') }}</p>
      <h3 class="dialog-title">
        {{ $gettext('Attachments') }}
        <span class="count-badge">{{ attachments.length }}</span>
      </h3>
    </div>

    <v-card-text>
      <v-form ref="formRef" @submit.prevent="submit">
        <div class="d-flex align-start gap-2">
          <v-file-input
            v-model="file"
            density="compact"
            variant="outlined"
            hide-details="auto"
            prepend-icon=""
            prepend-inner-icon="mdi-paperclip"
            :label="$gettext('Choose a file')"
            :rules="[rules.required]"
            class="flex-grow-1"
            @keyup.enter="submit"
          />
          <v-btn
            color="primary"
            variant="flat"
            height="40"
            prepend-icon="mdi-upload"
            :text="$gettext('Attach')"
            :loading="loading"
            :disabled="!file"
            @click="submit"
          />
        </div>
      </v-form>

      <transition name="fade">
        <v-alert
          v-if="successName"
          type="success"
          variant="tonal"
          density="compact"
          icon="mdi-check-circle"
          class="mt-3 success-alert"
        >
          {{ $gettext('Attached successfully:') }}
          <strong>{{ successName }}</strong>
        </v-alert>
      </transition>

      <p class="eyebrow mt-8 mb-2">
        {{ $gettext('Attached files') }} ({{ attachments.length }})
      </p>

      <transition-group
        v-if="attachments.length"
        name="attach"
        tag="div"
        class="attach-list"
      >
        <div
          v-for="attachment in attachments"
          :key="attachment.tmpname"
          class="attach-row"
        >
          <v-icon icon="mdi-file-outline" size="small" class="attach-row__icon" />
          <span class="attach-row__name">{{ attachment.fname }}</span>
          <v-btn
            icon="mdi-trash-can-outline"
            size="x-small"
            variant="text"
            color="error"
            :title="$gettext('Remove')"
            @click="removeAttachment(attachment)"
          />
        </div>
      </transition-group>

      <p v-else class="empty-hint">
        {{ $gettext('No attachments yet.') }}
      </p>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn :text="$gettext('Close')" variant="flat" @click="close" />
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { onUnmounted, ref } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useBusStore } from '@/stores'
import api from '@/api/webmail'
import rules from '@/plugins/rules'

const props = defineProps({
  sessionUid: {
    type: String,
    default: null,
  },
})
const emit = defineEmits(['close', 'change'])

const { $gettext } = useGettext()
const { displayNotification } = useBusStore()

const attachments = ref([])
const file = ref()
const formRef = ref()
const loading = ref(false)
const successName = ref('')
let successTimer = null

const close = () => {
  emit('close')
}

const flashSuccess = (name) => {
  successName.value = name
  clearTimeout(successTimer)
  successTimer = setTimeout(() => {
    successName.value = ''
  }, 4000)
}

const submit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  const formData = new FormData()
  formData.append('attachment', file.value)
  loading.value = true
  try {
    const resp = await api.uploadAttachment(props.sessionUid, formData)
    attachments.value.push(resp.data)
    // Clear the picker explicitly: v-form.reset() doesn't reliably clear the
    // file input's displayed name. resetValidation() avoids the "required"
    // error flashing on the now-empty field.
    file.value = null
    formRef.value.resetValidation()
    flashSuccess(resp.data.fname)
    displayNotification({
      msg: $gettext('Attachment added: %{name}', { name: resp.data.fname }),
    })
    emit('change', attachments.value.length)
  } finally {
    loading.value = false
  }
}

const removeAttachment = async (attachment) => {
  await api.removeAttachment(props.sessionUid, attachment.tmpname)
  const index = attachments.value.findIndex(
    (item) => item.tmpname === attachment.tmpname
  )
  attachments.value.splice(index, 1)
  emit('change', attachments.value.length)
}

onUnmounted(() => {
  clearTimeout(successTimer)
})

api.getComposeSession(props.sessionUid).then((resp) => {
  attachments.value = resp.data.attachments
  emit('change', attachments.value.length)
})
</script>

<style scoped>
.attachments-card {
  background-color: var(--bg-2);
}

/* Mono eyebrow + display title header, matching the editorial pages. */
.dialog-head {
  padding: 20px 20px 0;
}
.eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--fg-dim);
  margin: 0;
}
.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(20px, 2.4vw, 28px);
  letter-spacing: -0.02em;
  color: var(--fg);
  margin-top: 6px;
}
.count-badge {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  padding: 4px 9px;
  color: #0a0a0a;
  background: var(--accent);
}

.success-alert {
  border-radius: 0;
}

/* Hairline file list (editorial rows). */
.attach-list {
  border: 1px solid var(--line-2);
  background: var(--bg);
}
.attach-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 8px 12px;
  border-bottom: 1px solid var(--line);
}
.attach-row:last-child {
  border-bottom: 0;
}
.attach-row__icon {
  color: var(--accent);
}
.attach-row__name {
  flex: 1 1 auto;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.01em;
  color: var(--fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-hint {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--fg-mute);
  border: 1px dashed var(--line-2);
  padding: 16px;
  text-align: center;
}

/* New rows slide + fade in (clear feedback that the file landed); removed
   rows fade out. */
.attach-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.attach-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.attach-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.attach-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
