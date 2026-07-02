<template>
  <EmailContent
    v-if="mobile"
    :mailbox="route.query.mailbox"
    :mailid="route.query.mailid"
    @close="close"
    @deleted="close"
  />
</template>

<script setup>
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import EmailContent from '@/components/webmail/EmailContent.vue'

const { mobile } = useDisplay()
const route = useRoute()
const router = useRouter()

const close = () => {
  router.push({
    name: 'MailboxView',
    query: { mailbox: route.query.mailbox },
  })
}

// The dedicated reading route is the mobile form. On desktop (or when a
// mobile deep-link is opened on a wide screen, or the window is widened),
// hand off to MailboxView's split pane, keeping the message open via query.
watch(
  mobile,
  (isMobile) => {
    if (!isMobile) {
      router.replace({ name: 'MailboxView', query: route.query })
    }
  },
  { immediate: true }
)
</script>
