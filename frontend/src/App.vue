<template>
  <TopProgressBar />
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <Suspense v-if="Component">
        <component :is="Component" />
      </Suspense>
    </transition>
  </router-view>
</template>

<script setup>
import TopProgressBar from '@/components/shared/TopProgressBar.vue'
</script>
