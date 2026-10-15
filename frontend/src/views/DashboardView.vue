<template>
  <div class="dashboard">
    <GlobalStatisticsWidget v-if="isSuperAdmin" class="mb-10" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useAuthStore } from '@/stores'

import GlobalStatisticsWidget from '@/components/admin/dashboard/GlobalStatisticsWidget'
import parametersApi from '@/api/parameters'
import constants from '@/constants.json'

const { $gettext } = useGettext()
const authStore = useAuthStore()

const welcomeMsg = ref($gettext('Welcome to Modoboa'))

const isSuperAdmin = computed(
  () => authStore.authUser.role === constants.SUPER_ADMIN
)

onMounted(async () => {
  const response = await parametersApi.getGlobalApplication('core')
  if (response.data.params.custom_welcome_message) {
    welcomeMsg.value = response.data.params.custom_welcome_message
  }
})
</script>
