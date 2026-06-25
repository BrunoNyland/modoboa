<script setup lang="js">
import { onMounted } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()
const { $gettext } = useGettext()

onMounted(() => authStore.login())
</script>

<template>
  <v-container class="login-gate fill-height" fluid>
    <div class="login-gate__inner">
      <p class="eyebrow login-gate__eyebrow">
        {{ $gettext('Redirecting to secure sign-in') }}
      </p>
      <h1 class="login-gate__mark">modo<span class="text-accent">boa</span></h1>
      <div
        class="login-gate__bar"
        role="progressbar"
        :aria-label="$gettext('Signing you in')"
      >
        <span></span>
      </div>
      <p class="login-gate__foot">{{ $gettext('Authenticating') }} · OIDC</p>
    </div>
  </v-container>
</template>
