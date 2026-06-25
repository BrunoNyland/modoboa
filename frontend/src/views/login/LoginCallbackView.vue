<script setup>
import { useAuthStore } from '@/stores'
import { useModoboaTheme } from '@/composables/theme'

const props = defineProps({
  redirectUrl: String,
})

const authStore = useAuthStore()
const { enableTheme } = useModoboaTheme()

await authStore.completeLogin(props.redirectUrl)
await enableTheme()
</script>

<template>
  <v-container class="login-gate fill-height" fluid>
    <div class="login-gate__inner">
      <p class="eyebrow login-gate__eyebrow">
        {{ $gettext('Almost there') }}
      </p>
      <h1 class="login-gate__mark">modo<span class="text-accent">boa</span></h1>
      <div
        class="login-gate__bar"
        role="progressbar"
        :aria-label="$gettext('Finishing sign-in')"
      >
        <span></span>
      </div>
      <p class="login-gate__foot">{{ $gettext('Setting up your session') }}</p>
    </div>
  </v-container>
</template>
