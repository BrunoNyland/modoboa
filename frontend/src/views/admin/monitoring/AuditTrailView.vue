<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>{{ $gettext('Audit trail') }}</v-toolbar-title>
    </v-toolbar>
    <AuditTrailList />
  </div>
</template>

<script setup lang="js">
import AuditTrailList from '@/components/admin/logs/AuditTrailList.vue'
</script>

<style scoped>
.v-toolbar {
  background-color: rgb(var(--v-theme-background)) !important;
}
</style>
