<template>
  <router-view v-slot="{ Component, route }">
    <transition name="fade" mode="out-in">
      <Suspense>
        <component :is="Component" :key="route.path" />
      </Suspense>
    </transition>
  </router-view>
</template>

<script setup></script>
