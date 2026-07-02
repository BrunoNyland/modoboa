<template>
  <div class="webmail-shell">
    <ConnectedLayout>
    <template #navbar>
      <!-- Mobile-only top bar: hosts the hamburger that toggles the drawer. -->
      <v-app-bar v-if="mobile" flat density="comfortable" color="background">
        <v-app-bar-nav-icon
          :aria-label="$gettext('Toggle navigation')"
          @click="drawer = !drawer"
        />
        <span class="brand-wordmark brand-wordmark--sm">webmail</span>
      </v-app-bar>

      <v-navigation-drawer
        v-model="drawer"
        :rail="rail && !mobile"
        :width="drawerWidth"
        :permanent="!mobile"
        :temporary="mobile"
        color="background"
      >
        <div class="resize-handle" @mousedown="startResize" />
        <template #prepend>
          <div v-if="!mobile" class="d-flex align-center">
            <span v-if="!rail" class="brand-wordmark">webmail</span>
            <v-spacer v-if="!rail" />
            <v-btn
              variant="text"
              class="rounded-0 ma-0"
              style="width: 55px; height: 50px; min-width: 55px;"
              :aria-label="rail ? $gettext('Expand sidebar') : $gettext('Collapse sidebar')"
              @click.stop="rail = !rail"
            >
              <v-icon size="large">{{ rail ? 'mdi-chevron-right' : 'mdi-chevron-left' }}</v-icon>
            </v-btn>
          </div>


        </template>
        <MailboxList
          v-model="selectedMailbox"
          :mailboxes="userMailboxes"
          :rail="rail && !mobile"
          @update:model-value="openMailbox"
        />
        <template #append>
          <!-- Expanded drawer: full storage panel. -->
          <div v-if="!rail || mobile" class="quota-panel">
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
              :aria-label="$gettext('Storage usage')"
              :aria-valuetext="mailboxQuotaTitle"
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
          </div>

          <!-- Collapsed (rail) drawer: thin storage bar only. -->
          <div v-else class="quota-rail">
            <v-progress-linear
              v-if="mailboxQuota"
              :color="quotaColor"
              :model-value="hasQuotaLimit ? mailboxQuota.usage : 0"
              height="6"
              class="quota-rail__bar"
              :title="mailboxQuotaTitle"
              :aria-label="$gettext('Storage usage')"
              :aria-valuetext="mailboxQuotaTitle"
            />
          </div>
        </template>
      </v-navigation-drawer>
    </template>
  </ConnectedLayout>
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
import ConnectedLayout from '@/layouts/connected/ConnectedLayout.vue'
import MailboxList from '@/components/webmail/MailboxList.vue'
import api from '@/api/webmail'
import { useDisplay } from 'vuetify'

const { $gettext } = useGettext()
const route = useRoute()
const router = useRouter()
const busStore = useBusStore()

const { mobile } = useDisplay()
const drawer = ref(!mobile.value)
const rail = ref(false)

watch(mobile, (isMobile) => {
  drawer.value = !isMobile
})
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
const hdelimiter = ref(null)
const mailboxQuota = ref(null)
const selectedMailbox = ref(route.query.mailbox || 'INBOX')
const userMailboxes = ref([])

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
  if (mobile.value) {
    drawer.value = false
  }
}

const fetchUserMailboxes = async () => {
  const resp = await api.getUserMailboxes()
  userMailboxes.value = resp.data.mailboxes
  hdelimiter.value = resp.data.hdelimiter
}

const openComposeForm = () => {
  router.push({ name: 'ComposeEmailView' })
}

watch(dataKey, () => {
  fetchUserMailboxes()
})

// Refresh folder counters (unseen + total) after any count-changing action
// (delete, empty, mark read/unread, move). reloadMailboxCounters() bumps this.
watch(
  () => busStore.mbCounterKey,
  () => {
    fetchUserMailboxes()
  }
)

await fetchUserMailboxes()
const resp = await api.getUserMailboxQuota(route.query.mailbox || 'INBOX')
mailboxQuota.value = resp.data
</script>

<style>
/* Webmail is an app-shell: bind the layout to the viewport so the message
   list (and, later, the reading pane) scrolls internally instead of growing
   the whole page. Vuetify's wrap is `min-height: 100vh` by default, which
   lets tall content push the page taller than the viewport and defeats the
   internal scroller. Scoped to the webmail shell so other layouts keep their
   natural page-scroll behaviour. Non-scoped on purpose (targets Vuetify's
   generated .v-application__wrap). */
.webmail-shell .v-application__wrap {
  height: 100dvh;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.webmail-shell .v-main {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}
</style>

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
