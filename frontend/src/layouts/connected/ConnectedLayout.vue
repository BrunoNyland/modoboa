<template>
  <v-app>
    <slot name="navbar">
      <NavBar :color="color" :menu-items="menuItems" />
    </slot>
    <slot name="topbar">
      <TopMenu :user="authUser" />
    </slot>
    <ConnectedView />
    <v-snackbar
      v-model="snackbar"
      :color="notificationColor"
      :timeout="notificationTimeout"
      location="top"
    >
      {{ formattedNotification }}
      <template #actions>
        <v-btn color="white" variant="text" @click="snackbar = false">
          {{ $gettext('Close') }}
        </v-btn>
      </template>
    </v-snackbar>

    <v-dialog v-model="errorDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-error d-flex align-center">
          <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
          {{ $gettext('Error') }}
        </v-card-title>
        <v-card-text class="error-text-container text-body-1">
          {{ formattedNotification }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="errorDialog = false">
            {{ $gettext('Close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useAuthStore, useBusStore } from '@/stores'
import ConnectedView from './ConnectedView.vue'
import NavBar from '@/components/shared/NavBar.vue'
import TopMenu from '@/components/shared/TopMenu.vue'

const authStore = useAuthStore()
const busStore = useBusStore()
const { $gettext } = useGettext()

const props = defineProps({
  color: {
    type: String,
    default: 'background',
  },
  menuItems: {
    type: Array,
    default: null,
  },
  loadTheme: {
    type: Boolean,
    default: true,
  },
})

const authUser = computed(() => authStore.authUser)
const notificationColor = computed(() => busStore.notificationColor)
const notificationTimeout = computed(() => busStore.notificationTimeout)
const notification = computed(() => busStore.notification)
const snackbar = ref(false)
const errorDialog = ref(false)

const formattedNotification = computed(() => {
  const msg = notification.value
  if (!msg) return ''
  if (typeof msg === 'string') return msg

  if (Array.isArray(msg)) {
    return msg.join('\n')
  }

  if (typeof msg === 'object') {
    try {
      return Object.entries(msg)
        .map(([key, value]) => {
          if (Array.isArray(value)) return `${key}: ${value.join(', ')}`
          if (typeof value === 'object') return `${key}: ${JSON.stringify(value)}`
          return `${key}: ${value}`
        })
        .join('\n')
    } catch(e) {
      return String(msg)
    }
  }
  return String(msg)
})

busStore.$onAction(({ name, after }) => {
  if (name === 'displayNotification') {
    after(() => {
      if (busStore.notificationColor === 'error') {
        errorDialog.value = true
        snackbar.value = false
      } else {
        snackbar.value = true
        errorDialog.value = false
      }
    })
  }
  if (name === 'hideNotification') {
    after(() => {
      snackbar.value = false
      errorDialog.value = false
    })
  }
}, true)


</script>

<style>
.v-application {
  background-color: rgb(var(--v-theme-background)) !important;
}

.error-text-container {
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  background-color: rgb(var(--v-theme-surface-variant));
  padding: 16px;
  margin: 0 16px 16px 16px;
  border-radius: 4px;
}
</style>
