<template>
  <div class="h-100">
    <div
      v-show="loaded"
      class="email-view bg-background pa-4 h-100 d-flex flex-column"
    >
      <v-toolbar>
        <v-btn
          icon="mdi-arrow-left"
          size="small"
          variant="flat"
          :title="$gettext('Back')"
          :aria-label="$gettext('Back')"
          @click="close"
        />

        <div class="d-flex align-center flex-shrink-0">
          <v-btn
            prepend-icon="mdi-reply"
            height="36"
            variant="tonal"
            color="primary"
            @click="() => replyToEmail()"
          >
            {{ $gettext('Reply') }}
          </v-btn>
          <v-btn
            height="36"
            width="24"
            icon
            variant="tonal"
            color="primary"
            :title="$gettext('More reply options')"
            :aria-label="$gettext('More reply options')"
          >
            <v-icon icon="mdi-chevron-down" />
            <v-menu activator="parent">
              <v-list>
                <v-list-item
                  :title="$gettext('Reply all')"
                  @click="() => replyToEmail(true)"
                />
                <v-list-item
                  :title="$gettext('Forward')"
                  @click="forwardEmail"
                />
              </v-list>
            </v-menu>
          </v-btn>
        </div>
        <template v-if="$route.query.mailbox !== 'Scheduled'">
          <v-btn
            class="ml-2"
            color="error"
            variant="tonal"
            icon="mdi-trash-can"
            size="small"
            :title="$gettext('Delete')"
            :aria-label="$gettext('Delete')"
            :loading="working"
            @click="deleteEmail"
          >
          </v-btn>
          <v-btn
            v-if="route.query.mailbox === 'Trash'"
            class="ml-2"
            color="primary"
            variant="tonal"
            icon="mdi-backup-restore"
            size="small"
            :title="$gettext('Restore to Inbox')"
            :aria-label="$gettext('Restore to Inbox')"
            :loading="working"
            @click="restoreEmail"
          >
          </v-btn>
          <v-btn
            v-else-if="route.query.mailbox === 'Junk'"
            class="ml-2"
            color="success"
            variant="tonal"
            icon="mdi-thumb-up"
            size="small"
            :title="$gettext('Mark as not junk')"
            :aria-label="$gettext('Mark as not junk')"
            :loading="working"
            @click="markEmailAsNotJunk"
          >
          </v-btn>
          <v-btn
            v-else
            class="ml-2"
            color="warning"
            variant="tonal"
            icon="mdi-alert-octagon-outline"
            size="small"
            :title="$gettext('Mark as junk')"
            :aria-label="$gettext('Mark as junk')"
            :loading="working"
            @click="markEmailAsJunk"
          >
          </v-btn>
          <v-btn
            v-if="route.query.mailbox === constants.DRAFTS_FOLDER"
            class="ml-2"
            variant="tonal"
            icon="mdi-pencil"
            size="small"
            :title="$gettext('Edit draft')"
            :aria-label="$gettext('Edit draft')"
            @click="editDraft"
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
                v-if="!enableLinks"
                :title="$gettext('Enable links')"
                @click="enableLinks = true"
              />
              <v-list-item
                v-else
                :title="$gettext('Disable links')"
                @click="enableLinks = false"
              />
              <v-list-item
                :title="$gettext('Display source')"
                @click="openEmailSourceDialog"
              />
            </v-list>
          </v-menu>
        </v-btn>
      </v-toolbar>

      <div v-if="email" class="email-header">
        <h2>{{ email.subject }}</h2>
        <div class="d-flex mt-2">
          <v-menu key="sender">
            <template #activator="{ props }">
              <h3 v-bind="props">
                <template v-if="email.from_address.name">
                  {{ email.from_address.name }}
                  <span class="text-grey text-body-medium">
                    &lt;{{ email.from_address.address }}&gt;
                  </span>
                </template>
                <template v-else>
                  {{ email.from_address.address }}
                </template>
              </h3>
            </template>
            <ContactCard v-model="email.from_address" />
          </v-menu>
          <v-spacer />
          <span class="text-grey">{{ email.date }}</span>
        </div>
        <div v-if="email.to?.length" class="mt-2 text-grey">
          {{ $gettext('To') }}
          <v-menu v-for="(rcpt, index) in email.to" :key="`to-${index}`">
            <template #activator="{ props }">
              <span v-if="index > 0">, </span>
              <span v-bind="props">{{ rcpt.name || rcpt.address }}</span>
            </template>
            <ContactCard v-model="email.to[index]" />
          </v-menu>
          <template v-if="email.cc?.length">
            <v-menu v-for="(rcpt, index) in email.cc" :key="`cc-${index}`">
              <template #activator="{ props }">
                <span>, </span>
                <span v-bind="props">{{ rcpt.name || rcpt.address }}</span>
              </template>
              <ContactCard v-model="email.cc[index]" />
            </v-menu>
          </template>
        </div>
        <div v-if="email.attachments?.length" class="mt-2">
          <v-icon icon="mdi-paperclip" />
          <template
            v-for="(attachment, index) in email.attachments"
            :key="attachment.name"
          >
            <template v-if="index > 0">, </template>
            <a
              href="#"
              @click="downloadAttachment(attachment.name, attachment.partnum)"
            >
              {{ attachment.name }}
            </a>
          </template>
        </div>
      </div>
      <v-alert
        v-if="email?.scheduled_datetime"
        type="info"
        variant="tonal"
        density="compact"
        class="mx-1"
      >
        {{ $gettext('Message scheduled at:') }}
        {{ $date(email.scheduled_datetime) }}
      </v-alert>
      <iframe class="email-frame" />
    </div>
    <v-dialog v-model="showEmailSource" max-width="1200">
      <v-card :title="$gettext('Message source')">
        <v-card-text class="text-body-small overflow-x-auto">
          <pre>{{ emailSource }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            :text="$gettext('Close')"
            @click="showEmailSource = false"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGettext } from 'vue3-gettext'
import { useBusStore } from '@/stores'
import constants from '@/constants.json'
import api from '@/api/webmail'
import ContactCard from '@/components/webmail/ContactCard.vue'

const { $gettext } = useGettext()
const { displayNotification, reloadMailboxCounters } = useBusStore()
const route = useRoute()
const router = useRouter()

const enableLinks = ref(false)
const email = ref(null)
const emailSource = ref(null)
const loaded = ref(false)
const showEmailSource = ref(false)
const working = ref(false)

onMounted(() => {
  fetchMailContent()
})

watch(enableLinks, () => {
  fetchMailContent()
})

const close = () => {
  router.push({
    name: 'MailboxView',
    query: { mailbox: route.query.mailbox },
  })
}

const fetchMailContent = () => {
  const options = {
    dformat: 'html',
    links: enableLinks.value ? '1' : '0',
  }
  api
    .getEmailContent(route.query.mailbox, route.query.mailid, options)
    .then((resp) => {
      reloadMailboxCounters()
      email.value = resp.data
      nextTick(() => {
        const iframe = document.createElement('iframe')
        iframe.classList.add('email-frame')
        document.querySelector('iframe').replaceWith(iframe)
        if (email.value.body) {
          const iframeDoc = iframe.contentDocument
          iframeDoc.write(email.value.body)
          iframeDoc.close()
        }
        loaded.value = true
      })
    })
}

const downloadAttachment = (name, part) => {
  api
    .getEmailAttachment(route.query.mailbox, route.query.mailid, part)
    .then((resp) => {
      const blob = new Blob([resp.data], { type: resp.headers['Content-Type'] })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = name
      link.click()
      URL.revokeObjectURL(link.href)
    })
}

const deleteEmail = () => {
  working.value = true
  api.deleteSelection(route.query.mailbox, [route.query.mailid]).then(() => {
    working.value = false
    router.push({
      name: 'MailboxView',
      query: { mailbox: route.query.mailbox },
    })
    displayNotification({ msg: $gettext('Message deleted') })
    reloadMailboxCounters()
  })
}

const restoreEmail = () => {
  working.value = true
  api
    .moveSelection(route.query.mailbox, 'INBOX', [route.query.mailid])
    .then(() => {
      working.value = false
      router.push({
        name: 'MailboxView',
        query: { mailbox: route.query.mailbox },
      })
      displayNotification({ msg: $gettext('Message restored to Inbox') })
      reloadMailboxCounters()
    })
}

const markEmailAsJunk = () => {
  working.value = true
  api
    .markSelectionAsJunk(route.query.mailbox, [route.query.mailid])
    .then(() => {
      working.value = false
      router.push({
        name: 'MailboxView',
        query: { mailbox: route.query.mailbox },
      })
      displayNotification({ msg: $gettext('Message marked as junk') })
      reloadMailboxCounters()
    })
}

const markEmailAsNotJunk = () => {
  working.value = true
  api
    .markSelectionAsNotJunk(route.query.mailbox, [route.query.mailid])
    .then(() => {
      working.value = false
      router.push({
        name: 'MailboxView',
        query: { mailbox: route.query.mailbox },
      })
      displayNotification({ msg: $gettext('Message marked as not junk') })
      reloadMailboxCounters()
    })
}

const openEmailSourceDialog = async () => {
  if (!emailSource.value) {
    const resp = await api.getEmailSource(
      route.query.mailbox,
      route.query.mailid
    )
    emailSource.value = resp.data.source
  }
  showEmailSource.value = true
}

const replyToEmail = (all) => {
  const query = { ...route.query }
  if (all) {
    query.all = all
  }
  router.push({ name: 'ReplyEmailView', query })
}

const forwardEmail = () => {
  router.push({ name: 'ForwardEmailView', query: route.query })
}

const editDraft = () => {
  router.push({
    name: 'ComposeEmailView',
    query: { mailid: route.query.mailid },
  })
}
</script>

<style>
/* The view is a flex column: toolbar + header + (optional alert) in flow,
   then the message frame fills whatever height is left. No JS positioning,
   so the body never slides up from the bottom or fails to anchor. */
.email-view {
  height: 100%;
  min-height: 0;
}
/* Let the action toolbar wrap to a second line when the buttons don't fit
   (e.g. longer labels in pt-BR like "RESPONDER") instead of forcing a
   horizontal scrollbar. */
.email-view .v-toolbar,
.email-view .v-toolbar__content {
  height: auto !important;
}
.email-view .v-toolbar__content {
  flex-wrap: wrap;
  row-gap: 8px;
  padding-block: 8px;
}
.email-frame {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  margin-top: 12px;
  overflow-y: auto;
  border: none;
  /* The rendered email keeps a light canvas (messages assume white). */
  background-color: #fff;
  /* Soft fade-in instead of an abrupt white pop. */
  animation: email-frame-in 0.3s ease both;
}

@keyframes email-frame-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Message header is app chrome, not email content. Flush with the content
   edge (no side padding) so the subject lines up with the body below; a
   single bottom rule separates it from the rendered email. */
.email-header {
  padding: 4px 0 16px;
  border-bottom: 1px solid var(--line-2);
}
.email-header h2 {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(20px, 2.2vw, 30px);
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--fg);
}
.email-header h3 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 16px;
  letter-spacing: -0.01em;
  color: var(--fg);
}
.email-header .text-grey {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.03em;
}
</style>
