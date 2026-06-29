<template>
  <div v-if="user" class="top-menu">
    <v-btn
      v-if="globalStore.activeNotifications"
      icon
      color="error"
      class="mr-4"
      variant="tonal"
      size="small"
      :aria-label="$gettext('Notifications')"
    >
      <v-icon icon="mdi-bell" />
      <v-menu activator="parent" location="bottom">
        <v-list>
          <div class="text-center">
            <v-list-item :title="$gettext('Notifications')" />
          </div>
          <v-divider></v-divider>
          <v-list-item
            v-for="notif in globalStore.notifications"
            :key="notif.id"
            :to="notif.url"
          >
            <template #prepend>
              <v-badge
                :color="notif.color"
                :content="notif.counter"
                inline
              ></v-badge>
            </template>
            <v-list-item-title>{{ notif.text }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-btn>

    <v-btn icon flat color="primary">
      {{ userInitials }}
      <v-menu activator="parent" location="bottom">
        <v-card min-width="300" max-width="350">
          <v-list>
            <div class="text-center">
              <v-avatar color="primary" rounded="0" size="48">
                <span class="user-menu__initials">{{ userInitials }}</span>
              </v-avatar>
              <v-list-item :title="user.username" />
            </div>
            <v-divider></v-divider>
            <template v-for="(item, index) in userMenuItems" :key="index">
              <v-divider v-if="item.divider"></v-divider>
              <v-list-item
                v-else
                :to="item.to"
                :href="item.href"
                link
                @click="item.click"
              >
                <template #prepend>
                  <v-icon :icon="item.icon"></v-icon>
                </template>
                <v-list-item-title>{{ item.text }}</v-list-item-title>
              </v-list-item>
            </template>
          </v-list>
        </v-card>
      </v-menu>
    </v-btn>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { getActivePinia } from 'pinia'
import { useGettext } from 'vue3-gettext'
import { useGlobalStore } from '@/stores'

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  remote: {
    type: Boolean,
    default: false,
  },
})

const { $gettext } = useGettext()
const globalStore = useGlobalStore()

const applications = computed(() => globalStore.applications)
const userInitials = computed(() => {
  if (props.user.first_name && props.user.last_name) {
    return `${props.user.first_name[0].toUpperCase()}${props.user.last_name[0].toUpperCase()}`
  }
  if (props.user.username) {
    return props.user.username.slice(0, 2).toUpperCase()
  }
  return ''
})

const userMenuItems = computed(() => {
  const apps = applications.value.map(app => ({
    text: app.label,
    icon: app.icon,
    to: app.url,
    click: () => null,
  }))

  const items = []
  if (apps.length > 0) {
    items.push(...apps, { divider: true })
  }

  items.push(
    {
      text: $gettext('Account'),
      icon: 'mdi-account-circle-outline',
      to: !props.remote ? { name: 'AccountSettings' } : null,
      href: props.remote ? 'https://localhost:3000/account' : '',
      click: () => null,
    },
    {
      text: $gettext('Logout'),
      icon: 'mdi-logout',
      click: logout,
    }
  )

  return items
})

async function logout() {
  getActivePinia()._s.forEach(async (store) => await store.$reset())
}

onMounted(() => {
  globalStore.fetchAvailableApplications()
  globalStore.fetchNotifications()
})
</script>

<style scoped lang="scss">
.top-menu {
  position: fixed;
  top: 10px;
  right: 10px;
  /* Sit above the app bar (default z-index ~1004) so the avatar stays
     visible/clickable on mobile, where the app bar would otherwise cover it.
     Kept below the temporary drawer scrim so an open drawer dims it. */
  z-index: 1010;
}

/* On mobile the app bar is denser; nudge the avatar to line up within it. */
@media (max-width: 600px) {
  .top-menu {
    top: 6px;
    right: 6px;
  }
}

/* Match the user-menu avatar to the top-bar trigger avatar exactly:
   JetBrains Mono, 16px / 500, 0.05em tracking (the .v-btn defaults). */
.user-menu__initials {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
</style>
