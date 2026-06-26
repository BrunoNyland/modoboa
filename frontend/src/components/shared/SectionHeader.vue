<script setup>
/**
 * Editorial section header adapted from brunonyland.com: a mono uppercase
 * "eyebrow" (optionally numbered, accent), a large Space Grotesk display
 * title, and an optional subtitle. Use it at the top of views to give the
 * app the portfolio's typographic rhythm.
 *
 * The title also accepts a default slot for rich markup.
 */
defineProps({
  num: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <header class="section-head">
    <div v-if="eyebrow || num" class="section-head__eyebrow">
      <span v-if="num" class="section-head__num">{{ num }}</span>
      <span v-if="eyebrow" class="section-head__label">{{ eyebrow }}</span>
    </div>
    <h1 class="section-head__title">
      <slot>{{ title }}</slot>
    </h1>
    <p v-if="subtitle" class="section-head__sub">{{ subtitle }}</p>
  </header>
</template>

<style scoped lang="scss">
.section-head {
  margin-bottom: clamp(24px, 4vh, 48px);
}
.section-head__eyebrow {
  display: flex;
  gap: 14px;
  align-items: baseline;
  margin-bottom: 14px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--fg-dim);
}
.section-head__num {
  color: var(--accent);
}
.section-head__title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(30px, 5vw, 60px);
  line-height: 0.95;
  letter-spacing: -0.035em;
  color: var(--fg);
}
.section-head__sub {
  margin-top: 16px;
  max-width: 62ch;
  font-size: 15px;
  line-height: 1.5;
  color: var(--fg-dim);
}
</style>
