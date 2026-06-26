<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <Suspense>
        <component :is="Component" />
      </Suspense>
    </transition>
  </router-view>
</template>

<script setup></script>
