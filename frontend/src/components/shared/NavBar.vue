<template>
  <!-- Mobile-only top bar: hosts the hamburger that toggles the drawer. -->
  <v-app-bar v-if="mobile" flat density="comfortable" :color="color">
    <v-app-bar-nav-icon
      :aria-label="$gettext('Toggle navigation')"
      @click="drawer = !drawer"
    />
    <span
      class="brand-wordmark brand-wordmark--sm"
      @click="router.push(props.logoRoute)"
      >webmail</span
    >
  </v-app-bar>

  <v-navigation-drawer
    v-model="drawer"
    :rail="rail && !mobile"
    :permanent="!mobile"
    :temporary="mobile"
    :color="color"
    app
  >
    <div v-if="!mobile" class="d-flex align-center">
      <span
        v-if="!rail"
        class="brand-wordmark"
        @click="router.push(props.logoRoute)"
        >webmail</span
      >
      <v-spacer v-if="!rail" />
      <v-btn
        :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
        variant="text"
        :aria-label="rail ? $gettext('Expand sidebar') : $gettext('Collapse sidebar')"
        @click.stop="rail = !rail"
      >
      </v-btn>
    </div>

    <v-list
      :density="layoutStore.compactLeftMenu ? 'compact' : 'default'"
      :lines="layoutStore.compactLeftMenu ? false : true"
      nav
    >
      <template
        v-for="(item, index) in menuItems"
        :key="item.text + '-' + index"
      >
        <template v-if="displayMenuItem(item)">
          <v-list-subheader v-if="item.subheader" class="text-white">
            {{ item.text.toUpperCase() }}
          </v-list-subheader>
          <v-list-item
            v-else-if="item.action"
            :value="item.id || item.text"
            :exact="item.exact"
            :title="item.text"
            :prepend-icon="item.icon"
            @click="item.action"
          >
          </v-list-item>
          <v-list-item
            v-else-if="!item.children"
            :value="item.id || item.text"
            :to="item.to"
            link
            :exact="item.exact"
            :title="item.text"
            :prepend-icon="item.icon"
          >
          </v-list-item>
          <v-list-group v-else :value="item.id || item.text">
            <template #activator="{ props }">
              <v-list-item
                v-bind="props"
                :key="item.text + '-' + index"
                :title="item.text"
                color="white"
                :prepend-icon="item.icon"
              >
              </v-list-item>
            </template>
            <template
              v-for="(subitem, subindex) in item.children"
              :key="subitem.text + '-' + subindex"
            >
              <template v-if="displayMenuItem(subitem)">
                <v-list-item
                  v-if="subitem.action"
                  :title="subitem.text"
                  :value="subitem.id || subitem.text"
                  :prepend-icon="subitem.icon"
                  @click="subitem.action"
                ></v-list-item>
                <v-list-item
                  v-else
                  :to="subitem.to"
                  link
                  :title="subitem.text"
                  :value="subitem.id || subitem.text"
                  :prepend-icon="subitem.icon"
                ></v-list-item>
              </template>
            </template>
          </v-list-group>
        </template>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useAuthStore, useLayoutStore } from '@/stores'

const props = defineProps({
  color: {
    type: String,
    default: 'background',
  },
  menuItems: {
    type: Array,
    required: false,
    default: null,
  },
  logoRoute: {
    type: Object,
    default: null,
  },
})

const authStore = useAuthStore()
const layoutStore = useLayoutStore()
const router = useRouter()
const route = useRoute()
const { mobile } = useDisplay()

const rail = ref(false)
// Open by default on desktop (permanent drawer); closed on mobile (the
// hamburger in the app bar opens the temporary overlay drawer).
const drawer = ref(!mobile.value)

// Keep the drawer state sane when crossing the mobile breakpoint.
watch(mobile, (isMobile) => {
  drawer.value = !isMobile
})

// On mobile, dismiss the overlay drawer after navigating to a new view.
watch(
  () => route.fullPath,
  () => {
    if (mobile.value) {
      drawer.value = false
    }
  }
)

const authUser = computed(() => authStore.authUser)
const isAuthenticated = computed(() => authStore.isAuthenticated)

function displayMenuItem(item) {
  if (isAuthenticated.value) {
    const condition =
      (item.roles === undefined ||
        item.roles.indexOf(authUser.value.role) !== -1) &&
      (item.condition === undefined || item.condition()) &&
      item.activated !== false
    return condition
  }
  return false
}
</script>

