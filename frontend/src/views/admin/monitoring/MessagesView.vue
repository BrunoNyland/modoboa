<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>{{ $gettext('Message history') }}</v-toolbar-title>
    </v-toolbar>
    <MessageList />
  </div>
</template>

<script setup lang="js">
import MessageList from '@/components/admin/logs/MessageList'
</script>

<style scoped>
.v-toolbar {
  background-color: rgb(var(--v-theme-background)) !important;
}
</style>
