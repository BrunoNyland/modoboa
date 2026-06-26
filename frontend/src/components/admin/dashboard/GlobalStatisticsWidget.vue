<template>
  <section class="stat-block">
    <p class="eyebrow stat-block__eyebrow">{{ $gettext('Statistics') }}</p>
    <div class="stat-grid">
      <div class="stat">
        <div class="stat__n">{{ statistics.domain_count ?? 0 }}</div>
        <div class="stat__l">{{ $gettext('Domains') }}</div>
      </div>
      <div class="stat">
        <div class="stat__n">{{ statistics.domain_alias_count ?? 0 }}</div>
        <div class="stat__l">{{ $gettext('Domain aliases') }}</div>
      </div>
      <div class="stat">
        <div class="stat__n">{{ statistics.account_count ?? 0 }}</div>
        <div class="stat__l">{{ $gettext('Accounts') }}</div>
      </div>
      <div class="stat">
        <div class="stat__n">{{ statistics.alias_count ?? 0 }}</div>
        <div class="stat__l">{{ $gettext('Aliases') }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import adminApi from '@/api/admin'

const statistics = ref({})

const response = await adminApi.getStatistics()
statistics.value = response.data
</script>

<style scoped lang="scss">
.stat-block__eyebrow {
  margin-bottom: 16px;
}

/* Hairline grid of big editorial numbers (portfolio `.about__stats`). */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  background: var(--line-2);
  border: 1px solid var(--line-2);
}
.stat {
  background: var(--bg);
  padding: clamp(20px, 2.4vw, 28px) clamp(18px, 2vw, 24px);
  transition: background 0.3s;
}
.stat:hover {
  background: var(--bg-2);
}
.stat__n {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(36px, 4vw, 52px);
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--fg);
}
.stat__l {
  margin-top: 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--fg-dim);
}

@media (max-width: 599px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
