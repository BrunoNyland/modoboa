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
    <!-- Desktop: list on the left, reading pane on the right (Outlook-style),
         driven by the ?mailid= query so URLs stay shareable and back/forward
         walks through opened messages. Mobile keeps the single-column flow
         (list here, message on the EmailView route). -->
    <div v-if="!mobile" class="mailbox-split">
      <div class="mailbox-split__list" :style="{ width: listPaneWidth + 'px' }">
        <EmailList
          :mailbox="currentMailbox"
          :active-mailid="openedMailid"
          @open-email="onOpenEmail"
        />
      </div>
      <div
        class="mailbox-split__divider"
        role="separator"
        aria-orientation="vertical"
        :aria-label="$gettext('Resize reading pane')"
        @mousedown="startPaneResize"
      />
      <div class="mailbox-split__pane">
        <EmailContent
          v-if="openedMailid"
          :mailbox="currentMailbox"
          :mailid="openedMailid"
          :show-back-button="false"
          @deleted="onPaneDeleted"
          @loaded="onPaneLoaded"
        />
        <EmptyState
          v-else
          icon="mdi-email"
          :eyebrow="$gettext('Reading pane')"
          :title="$gettext('No message selected')"
          :message="$gettext('Pick a message from the list to read it here.')"
        />
      </div>
    </div>
    <EmailList
      v-else
      :mailbox="currentMailbox"
      @open-email="onOpenEmail"
    />

    <v-dialog
      v-model="showMailboxForm"
      :fullscreen="mobile"
      :max-width="mobile ? undefined : 800"
      :transition="mobile ? 'dialog-bottom-transition' : undefined"
    >
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
import { useDisplay } from 'vuetify'
import { useGettext } from 'vue3-gettext'
import { useBusStore, useWebmailStore } from '@/stores'
import EmailList from '@/components/webmail/EmailList.vue'
import EmailContent from '@/components/webmail/EmailContent.vue'
import MailboxForm from '@/components/webmail/MailboxForm.vue'
import EmptyState from '@/components/tools/EmptyState.vue'
import ConfirmDialog from '@/components/tools/ConfirmDialog.vue'
import api from '@/api/webmail'

const { $gettext } = useGettext()
const { mobile } = useDisplay()
const route = useRoute()
const router = useRouter()
const busStore = useBusStore()
const webmailStore = useWebmailStore()

const confirm = ref()
const userMailboxes = ref([])
const hdelimiter = ref(null)
const editedMailbox = ref(null)
const showMailboxForm = ref(false)

const currentMailbox = computed(() => route.query.mailbox || 'INBOX')
const openedMailid = computed(() => route.query.mailid || null)

// ----- reading pane width (desktop), persisted -----
const LIST_WIDTH_KEY = 'webmail.listPaneWidth'
const listPaneWidth = ref(
  Number(localStorage.getItem(LIST_WIDTH_KEY)) || 420
)

const startPaneResize = (e) => {
  e.preventDefault()
  const onMove = (event) => {
    const max = Math.round(window.innerWidth * 0.6)
    listPaneWidth.value = Math.min(Math.max(event.clientX - 256, 320), max)
  }
  const onUp = () => {
    document.body.style.userSelect = ''
    localStorage.setItem(LIST_WIDTH_KEY, String(listPaneWidth.value))
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// ----- open / navigation -----
const onOpenEmail = (mailid) => {
  if (mobile.value) {
    router.push({
      name: 'EmailView',
      query: { mailbox: currentMailbox.value, mailid },
    })
  } else {
    // Query-only change: MailboxView is not remounted, so the list keeps its
    // scroll and accumulated pages. push (not replace) so back/forward walks
    // through the messages the user opened.
    router.push({
      name: 'MailboxView',
      query: { mailbox: currentMailbox.value, mailid },
    })
  }
}

const onPaneDeleted = () => {
  router.replace({
    name: 'MailboxView',
    query: { mailbox: currentMailbox.value },
  })
  webmailStore.listingKey++
}

const onPaneLoaded = () => {
  // Backend marks the message seen on content fetch; clear the unseen bar in
  // the list without a refetch.
  if (openedMailid.value) {
    webmailStore.patchEmail(openedMailid.value, { style: '' })
  }
}

// A message deep-linked on desktop should open on the mobile route instead
// (and vice-versa) when crossing the breakpoint or opening a shared URL.
watch(
  [mobile, openedMailid],
  ([isMobile, mailid]) => {
    if (isMobile && mailid) {
      router.replace({ name: 'EmailView', query: route.query })
    }
  },
  { immediate: true }
)

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

<style scoped>
/* Fills the height left below the folder header; a horizontal split of
   list + reading pane. min-width/height:0 everywhere so the list and the
   pane's iframe can shrink instead of overflowing (flexbox min-width:auto
   is the classic culprit here). */
.mailbox-split {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}
.mailbox-split__list {
  flex: 0 0 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.mailbox-split__divider {
  flex: 0 0 5px;
  cursor: col-resize;
  position: relative;
  background: transparent;
}
.mailbox-split__divider::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2px;
  width: 1px;
  background: var(--line-2);
}
.mailbox-split__divider:hover::after {
  background: var(--accent);
}
.mailbox-split__pane {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
