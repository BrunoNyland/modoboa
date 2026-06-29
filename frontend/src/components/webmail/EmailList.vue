<template>
  <v-card class="mt-6 mb-2 mx-1">
    <v-toolbar flat>
      <v-checkbox
        v-model="selectAll"
        class="mr-4"
        hide-details
        color="primary"
        :aria-label="$gettext('Select all messages')"
        @update:model-value="toggleAllSelection"
      />

      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        :placeholder="$gettext('Search in messages')"
        :aria-label="$gettext('Search in messages')"
        variant="outlined"
        single-line
        flat
        hide-details
        density="compact"
        class="flex-grow-0 w-33 mr-4"
        clearable
        @click:clear="fetchEmails"
        @keyup.enter="submitSearch"
      ></v-text-field>
      <v-btn
        v-if="!inScheduledView"
        class="ml-2"
        color="secondary"
        variant="tonal"
        icon="mdi-pencil"
        size="small"
        :title="$gettext('Compose')"
        :aria-label="$gettext('Compose')"
        @click="openComposeForm"
      >
      </v-btn>
      <v-btn
        v-if="!inScheduledView"
        class="ml-2"
        color="error"
        variant="tonal"
        icon="mdi-trash-can"
        size="small"
        :title="$gettext('Delete selection')"
        :aria-label="$gettext('Delete selection')"
        :loading="working"
        @click="deleteSelection"
      >
      </v-btn>
      <template v-if="!inScheduledView">
        <v-btn
          v-if="currentMailbox === 'Trash'"
          class="ml-2"
          color="primary"
          variant="tonal"
          icon="mdi-backup-restore"
          size="small"
          :title="$gettext('Restore to Inbox')"
          :aria-label="$gettext('Restore to Inbox')"
          :loading="working"
          @click="restoreSelection"
        >
        </v-btn>
        <v-btn
          v-else-if="currentMailbox === 'Junk'"
          class="ml-2"
          color="success"
          variant="tonal"
          icon="mdi-thumb-up"
          size="small"
          :title="$gettext('Mark selection as not junk')"
          :aria-label="$gettext('Mark selection as not junk')"
          :loading="working"
          @click="markSelectionAsNotJunk"
        >
        </v-btn>
        <v-btn
          v-else
          class="ml-2"
          color="warning"
          variant="tonal"
          icon="mdi-alert-octagon-outline"
          size="small"
          :title="$gettext('Mark selection as junk')"
          :aria-label="$gettext('Mark selection as junk')"
          :loading="working"
          @click="markSelectionAsJunk"
        >
        </v-btn>
      </template>
      <v-btn
        class="ml-2"
        variant="tonal"
        icon
        size="small"
        :title="$gettext('More actions')"
        :aria-label="$gettext('More actions')"
      >
        <v-icon icon="mdi-cog" />
        <v-menu activator="parent">
          <v-list density="compact">
            <v-list-item
              :title="$gettext('Mark as read')"
              prepend-icon="mdi-eye"
              @click="() => flagSelection('read')"
            />
            <v-list-item
              :title="$gettext('Mark as unread')"
              prepend-icon="mdi-eye-outline"
              @click="() => flagSelection('unread')"
            />
            <v-list-item
              :title="$gettext('Mark as followed')"
              prepend-icon="mdi-star"
              @click="() => flagSelection('flagged')"
            />
            <v-list-item
              :title="$gettext('Mark as unfollowed')"
              prepend-icon="mdi-star-outline"
              @click="() => flagSelection('unflagged')"
            />
            <v-list-item
              v-if="$route.query.mailbox === 'Trash'"
              :title="$gettext('Empty mailbox')"
              prepend-icon="mdi-trash-can"
              @click="emptyMailbox"
            />
          </v-list>
        </v-menu>
      </v-btn>
      <v-spacer />
      <div v-if="emails.results" class="d-flex align-center">
        <div class="text-body-small mr-2">
          {{ emails.first_index }}-{{ emails.last_index }} {{ $gettext('on') }}
          {{ emails.count }}
        </div>
        <div>
          <v-btn
            icon="mdi-chevron-left"
            size="x-small"
            :title="$gettext('Previous page')"
            :aria-label="$gettext('Previous page')"
            :disabled="emails.prev_page === null"
            @click="page = emails.prev_page"
          />
          <v-btn
            icon="mdi-chevron-right"
            size="x-small"
            :title="$gettext('Next page')"
            :aria-label="$gettext('Next page')"
            :disabled="emails.next_page === null"
            @click="page = emails.next_page"
          />
        </div>
      </div>
    </v-toolbar>
  </v-card>
  <transition name="fade" mode="out-in">
    <div v-if="!loading" key="emails-content">
    <v-alert
      v-if="inScheduledView"
      type="info"
      variant="tonal"
      density="compact"
      class="mx-1"
    >
      {{
        $gettext(
          'Scheduled messages will be sent at the specified date and time. (visible on the right)'
        )
      }}
    </v-alert>
    <div
      class="emails position-absolute bottom-0 w-100 overflow-y-auto"
      :class="{ 'top-0': !inScheduledView, 'scheduling-top': inScheduledView }"
    >
      <template v-if="emails.results?.length">
        <div class="email-list">
          <div
            v-for="email in emails.results"
            :key="email.imapid"
            class="email-row"
            :class="{ 'email-row--unseen': email.style === 'unseen' }"
            draggable="true"
            @dragstart="onDragStart(email)"
          >
            <v-checkbox
              v-model="webmailStore.selection"
              :value="email.imapid"
              color="primary"
              density="compact"
              hide-details
              :aria-label="$gettext('Select message: %{subject}', { subject: email.subject })"
            />
            <v-btn
              :icon="email.flagged ? 'mdi-star' : 'mdi-star-outline'"
              :color="email.flagged ? 'warning' : undefined"
              variant="text"
              size="small"
              :title="
                email.flagged
                  ? $gettext('Unfollow message')
                  : $gettext('Follow message')
              "
              :aria-label="
                email.flagged
                  ? $gettext('Unfollow message')
                  : $gettext('Follow message')
              "
              @click="toggleFollowState(email)"
            />
            <v-menu v-if="inScheduledView" location="bottom">
              <template #activator="{ props }">
                <v-btn
                  icon="mdi-dots-vertical"
                  v-bind="props"
                  size="small"
                  variant="text"
                  :aria-label="$gettext('Message actions')"
                >
                </v-btn>
              </template>
              <MenuItems :items="getScheduledMessageActions()" :obj="email" />
            </v-menu>

            <div
              class="email-row__main clickable"
              @click="openEmail(email.imapid)"
            >
              <div class="email-row__subject">{{ email.subject }}</div>
              <div class="email-row__from">
                <EmailAddressList :addresses="getEmailAddresses(email)" />
              </div>
            </div>

            <div class="email-row__meta">
              <div v-if="!isScheduledDateOver(email)" class="email-row__date">
                {{ getEmailDate(email) }}
              </div>
              <div
                v-else
                class="email-row__date email-row__date--error clickable"
                @click="displaySchedulingError(email)"
              >
                {{ getEmailDate(email) }}
              </div>
              <div class="email-row__flags">
                <v-icon
                  v-if="email.answered"
                  icon="mdi-reply-outline"
                  size="small"
                />
                <v-icon
                  v-if="email.forwarded"
                  icon="mdi-share-outline"
                  size="small"
                />
                <v-icon
                  v-if="email.attachments"
                  icon="mdi-paperclip"
                  size="small"
                />
                <span>{{ $filesize(email.size) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <v-alert
        v-else
        class="mt-4"
        type="info"
        :text="$gettext('No message yet in this mailbox')"
        variant="tonal"
      />
    </div>
    <v-dialog v-model="showSchedulingForm" max-width="800">
      <EmailSchedulingForm
        :initial-date="selectedScheduledEmail.scheduled_datetime_raw"
        @schedule="updateScheduledEmail"
        @close="closeSchedulingForm"
      />
    </v-dialog>
    <v-dialog v-model="showSchedulingError" max-width="400">
      <v-card
        max-width="400"
        :text="schedulingError"
        :title="$gettext('Sending failure')"
      >
        <template #:actions>
          <v-btn
            class="ms-auto"
            :text="$gettext('Close')"
            @click="showSchedulingError = false"
          ></v-btn>
        </template>
      </v-card>
    </v-dialog>
    </div>
  </transition>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGettext } from 'vue3-gettext'
import { useBusStore, useWebmailStore } from '@/stores'
import { DateTime } from 'luxon'
import EmailAddressList from './EmailAddressList.vue'
import EmailSchedulingForm from './EmailSchedulingForm.vue'
import MenuItems from '@/components/tools/MenuItems.vue'
import api from '@/api/webmail'

const props = defineProps({
  mailbox: {
    type: String,
    default: 'INBOX',
  },
})

const { $gettext, $ngettext } = useGettext()
const { displayNotification, reloadMailboxCounters } = useBusStore()
const webmailStore = useWebmailStore()
const router = useRouter()
const route = useRoute()

const selectedScheduledEmail = ref(null)
const loading = ref(false)
const emails = ref({})
const page = ref(1)
const schedulingError = ref('')
const search = ref('')
const selectAll = ref(false)
const showSchedulingError = ref(false)
const showSchedulingForm = ref(false)
const working = ref(false)

let intervalId = null

const currentMailbox = computed(() => {
  return route.query.mailbox || 'INBOX'
})

const openComposeForm = () => {
  router.push({ name: 'ComposeEmailView' })
}

const inScheduledView = computed(() => props.mailbox === 'Scheduled')

const getScheduledMessageActions = () => {
  return [
    {
      label: $gettext('Reschedule'),
      icon: 'mdi-send-clock-outline',
      onClick: reScheduleMessage,
    },
    {
      label: $gettext('Delete'),
      icon: 'mdi-delete-outline',
      onClick: deleteScheduledMessage,
      color: 'red',
    },
  ]
}

const getEmailAddresses = (email) => {
  if (inScheduledView.value) {
    return email.recipients
  }
  return [email.from_address]
}

const getEmailDate = (email) => {
  if (inScheduledView.value) {
    return email.scheduled_datetime
  }
  return email.date
}

const isScheduledDateOver = (email) => {
  if (!inScheduledView.value || !email.scheduled_datetime_raw) return false
  const date = DateTime.fromISO(email.scheduled_datetime_raw)
  return date < DateTime.now()
}

const reScheduleMessage = (email) => {
  selectedScheduledEmail.value = email
  showSchedulingForm.value = true
}

const updateScheduledEmail = async (datetime) => {
  const data = {
    scheduled_datetime: datetime,
  }
  await api.updateScheduledMessage(
    selectedScheduledEmail.value.scheduled_id,
    data
  )
  fetchEmails()
  displayNotification({ msg: $gettext('Scheduling updated') })
}

const closeSchedulingForm = () => {
  showSchedulingForm.value = false
}

const deleteScheduledMessage = async (email) => {
  await api.deleteScheduledMessage(email.scheduled_id)
  fetchEmails()
  displayNotification({
    msg: $gettext('Scheduled canceled and message moved to trash folder'),
  })
}

const displaySchedulingError = async (email) => {
  const resp = await api.getScheduledMessage(email.scheduled_id)
  schedulingError.value = resp.data.error
  showSchedulingError.value = true
}

const openEmail = (emailid) => {
  router.push({
    name: 'EmailView',
    query: { mailbox: props.mailbox, mailid: emailid },
  })
}

const fetchEmails = () => {
  emails.value = {}
  loading.value = true
  api
    .getMailboxEmails(props.mailbox, { page: page.value, search: search.value })
    .then((resp) => {
      emails.value = resp.data
      loading.value = false
    })
    .catch(() => {
      loading.value = false
    })
}

const autoRefreshContent = () => {
  fetchEmails()
}

const submitSearch = () => {
  fetchEmails()
}

const toggleAllSelection = (value) => {
  if (!value) {
    webmailStore.selection = []
  } else {
    webmailStore.selection = emails.value.results.map((email) => email.imapid)
  }
}

const deleteSelection = () => {
  if (!webmailStore.selection.length) {
    return
  }
  working.value = true
  api.deleteSelection(currentMailbox.value, webmailStore.selection).then(() => {
    working.value = false
    webmailStore.selection = []
    displayNotification({ msg: $gettext('Message(s) deleted') })
    fetchEmails()
    reloadMailboxCounters()
  })
}

const restoreSelection = () => {
  if (!webmailStore.selection.length) {
    return
  }
  working.value = true
  api
    .moveSelection(currentMailbox.value, 'INBOX', webmailStore.selection)
    .then(() => {
      working.value = false
      webmailStore.selection = []
      displayNotification({ msg: $gettext('Message(s) restored to Inbox') })
      fetchEmails()
      reloadMailboxCounters()
    })
}

const markSelectionAsJunk = () => {
  if (!webmailStore.selection.length) {
    return
  }
  working.value = true
  api
    .markSelectionAsJunk(currentMailbox.value, webmailStore.selection)
    .then(() => {
      working.value = false
      webmailStore.selection = []
      displayNotification({ msg: $gettext('Message(s) marked as junk') })
      autoRefreshContent()
      reloadMailboxCounters()
    })
}

const markSelectionAsNotJunk = () => {
  if (!webmailStore.selection.length) {
    return
  }
  working.value = true
  api
    .markSelectionAsNotJunk(currentMailbox.value, webmailStore.selection)
    .then(() => {
      working.value = false
      webmailStore.selection = []
      displayNotification({ msg: $gettext('Message(s) marked as not junk') })
      autoRefreshContent()
      reloadMailboxCounters()
    })
}

const flagSelection = (status) => {
  if (!webmailStore.selection.length) {
    return
  }
  working.value = true
  api
    .flagSelection(currentMailbox.value, webmailStore.selection, status)
    .then(() => {
      working.value = false
      webmailStore.selection = []
      displayNotification({ msg: $gettext('Message(s) flagged') })
      fetchEmails()
      reloadMailboxCounters()
    })
}

const emptyMailbox = () => {
  loading.value = true
  api.emptyUserMailbox(currentMailbox.value).then(() => {
    emails.value = {}
    loading.value = false
    reloadMailboxCounters()
  })
}

const toggleFollowState = async (email) => {
  const flag = email.flagged ? 'unflagged' : 'flagged'
  await api.flagSelection(currentMailbox.value, [email.imapid], flag)
  email.flagged = flag === 'flagged'
}

const onDragStart = (email) => {
  if (!webmailStore.selection.includes(email.imapid)) {
    webmailStore.selection = [email.imapid]
  }
  const ghost = document.createElement('div')
  const count = webmailStore.selection.length || 0
  const msg = $ngettext('%{count} message', '%{count} messages', count, {
    count,
  })
  ghost.innerHTML = `
    <div class="pa-4 rounded-lg" style="background: #a9a9a9; opacity: 0.8; width: 300px">
      <div style="font-weight: 600">${msg}</div>
    </div>
  `
  document.body.appendChild(ghost)
  event.dataTransfer.setDragImage(ghost, -10, -10)
  setTimeout(() => ghost.remove(), 0)
}

onMounted(() => {
  intervalId = setInterval(autoRefreshContent, 300 * 1000)
})

onUnmounted(() => {
  clearInterval(intervalId)
})

watch(
  () => props.mailbox,
  () => {
    fetchEmails()
  },
  { immediate: true }
)
watch(
  () => webmailStore.selection,
  () => {
    if (!webmailStore.selection.length) {
      selectAll.value = false
    } else {
      selectAll.value = true
    }
  }
)
watch(
  () => webmailStore.listingKey,
  () => {
    fetchEmails()
  }
)
watch(page, () => {
  fetchEmails()
})
</script>

<style lang="scss" scoped>
.emails {
  margin-top: 150px;
}
.clickable {
  cursor: pointer;
}
.scheduling-top {
  top: 45px;
}

/* Dense hairline message list (portfolio editorial rows). */
.email-list {
  margin: 0 4px 8px;
  border: 1px solid var(--line-2);
  border-radius: 0;
  background: var(--bg);
  overflow: hidden;
}
.email-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 16px 6px 6px;
  border-bottom: 1px solid var(--line);
  transition: background 0.2s;
}
.email-row:last-child {
  border-bottom: 0;
}
.email-row:hover {
  background: var(--bg-2);
}
.email-row--unseen::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--accent);
}
.email-row__main {
  flex: 1 1 auto;
  min-width: 0;
  margin-left: 8px;
}
.email-row__subject {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 15px;
  letter-spacing: -0.01em;
  color: var(--fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.email-row--unseen .email-row__subject {
  font-weight: 700;
}
.email-row__from {
  margin-top: 2px;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.02em;
  color: var(--fg-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.email-row__meta {
  flex: 0 0 auto;
  padding-left: 16px;
  text-align: right;
}
.email-row__date {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--fg-dim);
}
.email-row__date--error {
  color: rgb(var(--v-theme-error));
  font-weight: 700;
}
.email-row__flags {
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-mute);
}
</style>
