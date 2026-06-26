<template>
  <div>
    <ConnectedLayout>
    <template #navbar>
      <v-navigation-drawer
        v-model="drawer"
        :rail="rail"
        :width="drawerWidth"
        permanent
        color="background"
      >
        <div class="resize-handle" @mousedown="startResize" />
        <template #prepend>
          <div class="d-flex align-center">
            <span v-if="!rail" class="brand-wordmark">webmail</span>
            <v-spacer v-if="!rail" />
            <v-btn
              :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
              variant="text"
              @click.stop="rail = !rail"
            >
            </v-btn>
          </div>

          <div class="d-flex justify-center mb-4">
            <v-btn
              v-if="!rail"
              :text="$gettext('Compose')"
              color="secondary"
              variant="flat"
              prepend-icon="mdi-pencil"
              @click="openComposeForm"
            />
            <v-btn
              v-else
              icon="mdi-pencil"
              color="secondary"
              variant="flat"
              size="small"
              @click="openComposeForm"
            />
          </div>
        </template>
        <MailboxList
          v-model="selectedMailbox"
          :mailboxes="userMailboxes"
          class="mr-2"
          :rail="rail"
          @update:model-value="openMailbox"
        />
        <template #append>
          <!-- Expanded drawer: full storage panel. -->
          <div v-if="!rail" class="quota-panel">
            <div class="quota-panel__head">
              <span class="quota-panel__eyebrow">{{ $gettext('Storage') }}</span>
              <span v-if="mailboxQuota && hasQuotaLimit" class="quota-panel__pct">
                {{ mailboxQuota.usage }}%
              </span>
            </div>
            <v-progress-linear
              v-if="mailboxQuota"
              :color="quotaColor"
              :model-value="hasQuotaLimit ? mailboxQuota.usage : 0"
              height="8"
              class="quota-panel__bar"
            />
            <div v-if="mailboxQuota" class="quota-panel__detail">
              <template v-if="hasQuotaLimit">
                <strong>{{ quotaUsedLabel }}</strong> / {{ quotaLimitLabel }}
              </template>
              <template v-else>
                <strong>{{ quotaUsedLabel }}</strong>
                {{ $gettext('used') }} · {{ $gettext('Unlimited') }}
              </template>
            </div>
            <v-btn
              block
              variant="tonal"
              size="small"
              prepend-icon="mdi-cog-outline"
              class="quota-panel__settings"
            >
              {{ $gettext('Settings') }}
              <v-menu activator="parent" location="top">
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

          <!-- Collapsed (rail) drawer: compact icon + thin bar. -->
          <div v-else class="quota-rail">
            <v-btn
              icon="mdi-cog-outline"
              variant="text"
              size="small"
              :title="$gettext('Mailbox settings')"
            >
              <v-icon icon="mdi-cog-outline" />
              <v-menu activator="parent" location="top">
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
            <v-progress-linear
              v-if="mailboxQuota"
              :color="quotaColor"
              :model-value="hasQuotaLimit ? mailboxQuota.usage : 0"
              height="6"
              class="quota-rail__bar"
              :title="mailboxQuotaTitle"
            />
          </div>
        </template>
      </v-navigation-drawer>
    </template>
  </ConnectedLayout>
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
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGettext } from 'vue3-gettext'
import { filesize } from 'filesize'
import { useBusStore } from '@/stores'
import { localeToBCP47 } from '@/utils'
import gettext from '@/plugins/gettext'
import ConfirmDialog from '@/components/tools/ConfirmDialog.vue'
import ConnectedLayout from '@/layouts/connected/ConnectedLayout.vue'
import MailboxForm from '@/components/webmail/MailboxForm.vue'
import MailboxList from '@/components/webmail/MailboxList.vue'
import api from '@/api/webmail'

const { $gettext } = useGettext()
const route = useRoute()
const router = useRouter()
const busStore = useBusStore()

const confirm = ref()
const drawer = ref(true)
const rail = ref(false)
const drawerWidth = ref(256)
const isResizing = ref(false)

function startResize(e) {
  e.preventDefault()
  isResizing.value = true
  const onMouseMove = (event) => {
    const newWidth = Math.min(Math.max(event.clientX, 200), 600)
    drawerWidth.value = newWidth
  }
  const onMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
const editedMailbox = ref(null)
const hdelimiter = ref(null)
const mailboxQuota = ref(null)
const selectedMailbox = ref(route.query.mailbox || 'INBOX')
const showMailboxForm = ref(false)
const userMailboxes = ref([])

const readOnlyMailbox = computed(() => {
  const mailboxes = ['INBOX']
  return mailboxes.includes(route.query.mailbox || 'INBOX')
})

const quotaColor = computed(() => {
  if (!mailboxQuota.value || !hasQuotaLimit.value) {
    return 'info'
  }
  if (mailboxQuota.value.usage < 50) {
    return 'info'
  }
  if (mailboxQuota.value.usage < 80) {
    return 'warning'
  }
  return 'error'
})

// IMAP STORAGE quota comes in KiB; render it as MB/GB with the locale's
// numeric separators (pt-BR: 1000 -> 1.000).
const formatStorage = (kib) => {
  if (kib == null) {
    return ''
  }
  return filesize(kib * 1024, {
    standard: 'jedec',
    round: 1,
    locale: localeToBCP47(gettext.current),
  })
}

const hasQuotaLimit = computed(
  () => !!mailboxQuota.value && mailboxQuota.value.limit > 0
)
const quotaUsedLabel = computed(() => formatStorage(mailboxQuota.value?.current))
const quotaLimitLabel = computed(() => formatStorage(mailboxQuota.value?.limit))

const mailboxQuotaTitle = computed(() => {
  if (!mailboxQuota.value) {
    return ''
  }
  if (!hasQuotaLimit.value) {
    return `${quotaUsedLabel.value} ${$gettext('used')}`
  }
  return `${quotaUsedLabel.value} / ${quotaLimitLabel.value} (${mailboxQuota.value.usage}%)`
})

const dataKey = computed(() => busStore.dataKey)

function openMailbox(mailbox) {
  router.push({
    name: 'MailboxView',
    query: { mailbox },
  })
  api.getUserMailboxQuota(mailbox).then((resp) => {
    mailboxQuota.value = resp.data
  })
}

const fetchUserMailboxes = async () => {
  const resp = await api.getUserMailboxes()
  userMailboxes.value = resp.data.mailboxes
  hdelimiter.value = resp.data.hdelimiter
}

const openComposeForm = () => {
  router.push({ name: 'ComposeEmailView' })
}

const closeMailboxForm = () => {
  showMailboxForm.value = false
  editedMailbox.value = null
  fetchUserMailboxes()
}

const openMailboxForm = () => {
  showMailboxForm.value = true
}

const editMailbox = () => {
  editedMailbox.value = selectedMailbox.value
  showMailboxForm.value = true
}

const navigateToMailbox = (mailbox) => {
  selectedMailbox.value = mailbox
  router.push({
    name: 'MailboxView',
    query: { mailbox },
  })
}

const compressMailbox = async () => {
  await api.compressUserMailbox({ name: selectedMailbox.value })
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
  await api.deleteUserMailbox({ name: selectedMailbox.value })
  busStore.displayNotification({ msg: $gettext('Mailbox deleted') })
  navigateToMailbox('INBOX')
}

watch(dataKey, () => {
  fetchUserMailboxes()
})

await fetchUserMailboxes()
const resp = await api.getUserMailboxQuota(route.query.mailbox || 'INBOX')
mailboxQuota.value = resp.data
</script>

<style scoped>
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  z-index: 100;
}
.resize-handle:hover {
  background-color: rgba(0, 0, 0, 0.12);
}

/* Storage / quota panel at the bottom of the drawer. */
.quota-panel {
  margin: 8px;
  padding: 14px;
  border: 1px solid var(--line-2);
  background: var(--bg-2);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.quota-panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.quota-panel__eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--fg-dim);
}
.quota-panel__pct {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--fg);
}
.quota-panel__bar {
  border-radius: 0;
}
.quota-panel__detail {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.02em;
  color: var(--fg-dim);
}
.quota-panel__detail strong {
  color: var(--fg);
  font-weight: 600;
}
.quota-panel__settings {
  margin-top: 2px;
}

/* Compact variant when the drawer is collapsed to a rail. */
.quota-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 6px;
}
.quota-rail__bar {
  width: 32px;
  border-radius: 0;
}
</style>
