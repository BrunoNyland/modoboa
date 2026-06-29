<template>
  <div class="mailbox-view d-flex flex-column h-100">
    <div class="d-flex align-center ml-4">
      <span class="text-headline-medium">{{ currentFolderLabel }}</span>
      <v-btn
        icon
        variant="text"
        size="small"
        class="ml-2"
        :title="$gettext('Mailbox settings')"
        :aria-label="$gettext('Mailbox settings')"
      >
        <v-icon icon="mdi-cog-outline" />
        <v-menu activator="parent" location="bottom">
          <v-list density="compact">
            <v-list-item
              :title="$gettext('Create a new mailbox')"
              prepend-icon="mdi-plus"
              @click="openMailboxForm"
            />
            <v-list-item
              :title="$gettext('Edit this mailbox')"
              prepend-icon="mdi-pencil"
              :disabled="readOnlyMailbox"
              @click="editMailbox"
            />
            <v-list-item
              :title="$gettext('Delete this mailbox')"
              prepend-icon="mdi-trash-can"
              :disabled="readOnlyMailbox"
              @click="deleteMailbox"
            />
            <v-list-item
              :title="$gettext('Compress this mailbox')"
              prepend-icon="mdi-folder-zip-outline"
              @click="compressMailbox"
            />
          </v-list>
        </v-menu>
      </v-btn>
    </div>
    <EmailList :mailbox="$route.query.mailbox || 'INBOX'" />

    <v-dialog v-model="showMailboxForm" max-width="800">
      <MailboxForm
        :user-mailboxes="userMailboxes"
        :mailbox="editedMailbox"
        :hdelimiter="hdelimiter"
        @mailbox-renamed="navigateToMailbox"
        @close="closeMailboxForm()"
      />
    </v-dialog>
    <ConfirmDialog ref="confirm" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGettext } from 'vue3-gettext'
import { useBusStore } from '@/stores'
import EmailList from '@/components/webmail/EmailList.vue'
import MailboxForm from '@/components/webmail/MailboxForm.vue'
import ConfirmDialog from '@/components/tools/ConfirmDialog.vue'
import api from '@/api/webmail'

const { $gettext } = useGettext()
const route = useRoute()
const router = useRouter()
const busStore = useBusStore()

const confirm = ref()
const userMailboxes = ref([])
const hdelimiter = ref(null)
const editedMailbox = ref(null)
const showMailboxForm = ref(false)

const currentMailbox = computed(() => route.query.mailbox || 'INBOX')

const readOnlyMailbox = computed(() => ['INBOX', 'Sent', 'Drafts', 'Trash', 'Junk'].includes(currentMailbox.value))

// Name of the currently open folder. Prefer the (already translated) label
// from the backend; fall back to the last path segment for nested mailboxes.
const currentFolderLabel = computed(() => {
  const found = userMailboxes.value.find((mb) => mb.name === currentMailbox.value)
  if (found) {
    return found.label.split('/').pop()
  }
  return currentMailbox.value.split(hdelimiter.value || '.').pop()
})

const fetchUserMailboxes = async () => {
  const resp = await api.getUserMailboxes()
  userMailboxes.value = resp.data.mailboxes
  hdelimiter.value = resp.data.hdelimiter
}

const openMailboxForm = () => {
  editedMailbox.value = null
  showMailboxForm.value = true
}

const editMailbox = () => {
  editedMailbox.value = currentMailbox.value
  showMailboxForm.value = true
}

const closeMailboxForm = () => {
  showMailboxForm.value = false
  editedMailbox.value = null
  fetchUserMailboxes()
  // Refresh the drawer's mailbox list too.
  busStore.reloadData()
}

const navigateToMailbox = (mailbox) => {
  router.push({ name: 'MailboxView', query: { mailbox } })
  busStore.reloadData()
}

const compressMailbox = async () => {
  await api.compressUserMailbox({ name: currentMailbox.value })
  busStore.displayNotification({ msg: $gettext('Mailbox compressed') })
}

const deleteMailbox = async () => {
  const confirmed = await confirm.value.open(
    $gettext('Warning'),
    $gettext('Delete this mailbox?'),
    {
      color: 'warning',
      agreeLabel: $gettext('Yes'),
      cancelLabel: $gettext('No'),
    }
  )
  if (!confirmed) {
    return
  }
  await api.deleteUserMailbox({ name: currentMailbox.value })
  busStore.displayNotification({ msg: $gettext('Mailbox deleted') })
  navigateToMailbox('INBOX')
}

watch(() => busStore.dataKey, fetchUserMailboxes)

onMounted(fetchUserMailboxes)
</script>
