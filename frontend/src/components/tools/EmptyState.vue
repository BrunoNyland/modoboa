<template>
  <div class="empty-state">
    <v-icon v-if="icon" :icon="icon" size="40" class="empty-state__icon" />
    <div v-if="eyebrow" class="empty-state__eyebrow">{{ eyebrow }}</div>
    <div class="empty-state__title">{{ title }}</div>
    <div v-if="message" class="empty-state__message">{{ message }}</div>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  icon: { type: String, default: '' },
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  padding: 48px 24px;
  margin: 4px;
  border: 1px solid var(--line-2);
  border-radius: 0;
  background: var(--bg);
  color: var(--fg-dim);
}
.empty-state__icon {
  color: var(--fg-mute);
  margin-bottom: 4px;
}
.empty-state__eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--fg-mute);
}
.empty-state__title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(16px, 3vw, 20px);
  letter-spacing: -0.01em;
  color: var(--fg);
}
.empty-state__message {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.02em;
  color: var(--fg-dim);
  max-width: 42ch;
}
</style>
