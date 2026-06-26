<script setup>
import { useAuthStore } from '@/stores'

const props = defineProps({
  redirectUrl: String,
})

const authStore = useAuthStore()

await authStore.completeLogin(props.redirectUrl)
</script>

<template>
  <div class="auth-screen" role="status" aria-live="polite">
    <span class="sr-only">{{ $gettext('Finishing sign-in…') }}</span>
  </div>
</template>
