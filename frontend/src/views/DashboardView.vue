<template>
  <div class="dashboard">
    <SectionHeader
      num="00"
      :eyebrow="$gettext('Dashboard')"
      :title="welcomeMsg"
    />

    <GlobalStatisticsWidget v-if="isSuperAdmin" class="mb-10" />

    <v-row>
      <v-col cols="12" md="7">
        <NewsFeedWidget />
      </v-col>
      <v-col cols="12" md="5"></v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useAuthStore } from '@/stores'

import SectionHeader from '@/components/shared/SectionHeader.vue'
import GlobalStatisticsWidget from '@/components/admin/dashboard/GlobalStatisticsWidget'
import NewsFeedWidget from '@/components/admin/dashboard/NewsFeedWidget'
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
