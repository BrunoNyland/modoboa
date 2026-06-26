<script setup lang="js">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()

onMounted(() => authStore.login())
</script>

<template>
  <div class="auth-screen" role="status" aria-live="polite">
    <span class="sr-only">{{ $gettext('Signing you in…') }}</span>
  </div>
</template>
