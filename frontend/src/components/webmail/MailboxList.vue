<template>
  <v-list nav density="compact" class="pa-0 bg-transparent">
    <div
      v-for="mailbox in props.mailboxes"
      :key="mailbox.name"
      class="mailbox-wrapper"
    >
      <v-list-item
        :active="model === mailbox.name"
        :prepend-icon="iconByMailboxType[mailbox.type]"
        class="mailbox"
        link
        @click="updateSelection(mailbox.name)"
        @mouseover="setHover(mailbox, true)"
        @mouseleave="setHover(mailbox, false)"
        @dragover.prevent
        @dragenter="setHover(mailbox, true)"
        @dragleave="setHover(mailbox, false)"
        @drop="onDrop(mailbox)"
      >
        <v-list-item-title>
          <template v-if="!props.rail">
            <template v-if="mailbox.name === route.query.mailbox">
              <span v-if="currentMailboxUnseen > 0" class="font-weight-bold">
                {{ getMailboxLabel(mailbox) }} ({{
                  getCurrentMailboxUnseen(mailbox)
                }})
              </span>
              <span v-else>
                {{ getMailboxLabel(mailbox) }}
              </span>
            </template>
            <template v-else>
              <span v-if="mailbox.unseen > 0" class="font-weight-bold">
                {{ getMailboxLabel(mailbox) }} ({{ mailbox.unseen }})
              </span>
              <span v-else>
                {{ getMailboxLabel(mailbox) }}
              </span>
            </template>
          </template>
        </v-list-item-title>

        <template #append v-if="!props.rail && mailbox.sub">
          <v-btn
            :icon="getMailboxState(mailbox) ? 'mdi-minus' : 'mdi-plus'"
            size="x-small"
            variant="flat"
            color="transparent"
            @click.stop="toggleMailbox(mailbox)"
          />
        </template>
      </v-list-item>

      <div class="pl-4" v-if="getMailboxState(mailbox) && mailbox.sub && mailbox.sub.length">
        <MailboxList
          v-model="model"
          :mailboxes="mailbox.sub"
          class="mt-1"
          :light-mode="props.lightMode"
          :compact="props.compact"
        />
      </div>
    </div>
  </v-list>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGettext } from 'vue3-gettext'
import { useBusStore, useWebmailStore } from '@/stores'
import api from '@/api/webmail'

const props = defineProps({
  mailboxes: {
    type: Array,
    default: null,
  },
  lightMode: {
    type: Boolean,
    default: false,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  unseenCounters: {
    type: Boolean,
    default: true,
  },
  allowUnselect: {
    type: Boolean,
    default: false,
  },
  rail: {
    type: Boolean,
    default: false,
  },
})
const model = defineModel()
const emit = defineEmits(['update:modelValue'])

const route = useRoute()
const { $gettext } = useGettext()
const busStore = useBusStore()
const webmailStore = useWebmailStore()

const iconByMailboxType = {
  inbox: 'mdi-inbox',
  draft: 'mdi-file',
  junk: 'mdi-fire',
  sent: 'mdi-email-fast-outline',
  scheduled: 'mdi-send-clock-outline',
  trash: 'mdi-trash-can-outline',
  normal: 'mdi-folder-outline',
}

const currentMailboxUnseen = ref(null)
const hoverStates = ref({})
const mailboxStates = ref({})

function getMailboxLabel(mailbox) {
  return mailbox.label.split('/').pop()
}

function getCurrentMailboxUnseen(mailbox) {
  if (currentMailboxUnseen.value === null) {
    currentMailboxUnseen.value = mailbox.unseen
  }
  return currentMailboxUnseen.value
}

function setHover(mailbox, value) {
  hoverStates.value[mailbox.name] = value
}

function getMailboxState(mailbox) {
  return mailboxStates.value[mailbox.name]
}

function toggleMailbox(mailbox) {
  if (!mailboxStates.value[mailbox.name]) {
    mailboxStates.value[mailbox.name] = false
  }
  mailboxStates.value[mailbox.name] = !mailboxStates.value[mailbox.name]
  if (mailboxStates.value[mailbox.name] && !mailbox.sub.length) {
    api.getUserMailboxes(mailbox.name).then((resp) => {
      mailbox.sub = resp.data.mailboxes
    })
  }
}

function updateSelection(value) {
  if (props.allowUnselect && value === model.value) {
    emit('update:modelValue', null)
  } else {
    emit('update:modelValue', value)
  }
}

async function onDrop(mailbox) {
  try {
    busStore.displayNotification({
      msg: $gettext('Moving selection...'),
      type: 'info',
      timeout: 0,
    })
    const resp = await api.moveSelection(
      route.query.mailbox || 'INBOX',
      mailbox.name,
      webmailStore.selection
    )
    webmailStore.listingKey++
    webmailStore.selection = []
  } finally {
    busStore.hideNotification()
  }
}

watch(
  () => busStore.mbCounterKey,
  () => {
    api.getUserMailboxUnseen(route.query.mailbox).then((resp) => {
      currentMailboxUnseen.value = resp.data.counter
    })
  }
)
</script>

<style scoped lang="scss">
.mailbox {
  cursor: pointer;
}
</style>
