<template>
  <EmailContent
    :mailbox="route.query.mailbox"
    :mailid="route.query.mailid"
    @close="close"
    @deleted="close"
  />
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import EmailContent from '@/components/webmail/EmailContent.vue'

const route = useRoute()
const router = useRouter()

const close = () => {
  router.push({
    name: 'MailboxView',
    query: { mailbox: route.query.mailbox },
  })
}
</script>
