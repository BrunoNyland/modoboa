<template>
  <div
    class="top-progress"
    :class="{ 'top-progress--loading': barState !== 'idle' }"
    :style="{ transform: `scaleX(${width})`, opacity: visible ? 1 : 0 }"
    role="progressbar"
    aria-label="Page progress"
    :aria-valuenow="Math.round(width * 100)"
    aria-valuemin="0"
    aria-valuemax="100"
  />
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProgressStore } from '@/stores'

const progress = useProgressStore()
const route = useRoute()

// 'idle' = show scroll progress; 'loading' = trickle; 'done' = snap to 100% then fade.
const barState = ref('idle')
const loadWidth = ref(0)
let trickleId = null
let doneId = null

const width = computed(() =>
  barState.value === 'idle' ? progress.scroll : loadWidth.value
)
// Hide the bar when idle with nothing scrolled, so it isn't a permanent line.
const visible = computed(
  () => barState.value !== 'idle' || progress.scroll > 0.002
)

function clearTimers() {
  if (trickleId) {
    clearInterval(trickleId)
    trickleId = null
  }
  if (doneId) {
    clearTimeout(doneId)
    doneId = null
  }
}

// Classic "trickle": climb quickly at first, then ease toward 90% so the bar
// keeps moving while we wait, without ever pretending to finish.
function startTrickle() {
  clearTimers()
  barState.value = 'loading'
  if (loadWidth.value < 0.08) {
    loadWidth.value = 0.08
  }
  trickleId = setInterval(() => {
    loadWidth.value += (0.9 - loadWidth.value) * 0.15
    if (loadWidth.value > 0.9) {
      loadWidth.value = 0.9
    }
  }, 300)
}

function finishTrickle() {
  clearTimers()
  barState.value = 'done'
  loadWidth.value = 1
  doneId = setTimeout(() => {
    barState.value = 'idle'
    loadWidth.value = 0
  }, 300)
}

watch(
  () => progress.isLoading,
  (loading) => {
    if (loading) {
      startTrickle()
    } else if (barState.value === 'loading') {
      finishTrickle()
    }
  }
)

// Reset reading progress whenever the route changes (new page starts at 0).
watch(
  () => route.fullPath,
  () => progress.setScroll(0)
)

// Scroll events don't bubble, but a capture-phase listener on the document
// still receives them for any nested overflow container (e.g. the email list's
// scroll area or a window scroll). The email reading iframe is a separate
// document and feeds the store directly from EmailView.
function onScroll(e) {
  const el = e.target
  let scrollTop
  let scrollHeight
  let clientHeight
  if (!el || el === document || el === document.documentElement || el === document.body) {
    const d = document.scrollingElement || document.documentElement
    scrollTop = d.scrollTop
    scrollHeight = d.scrollHeight
    clientHeight = d.clientHeight
  } else if (typeof el.scrollHeight === 'number') {
    scrollTop = el.scrollTop
    scrollHeight = el.scrollHeight
    clientHeight = el.clientHeight
  } else {
    return
  }
  const max = scrollHeight - clientHeight
  progress.setScroll(max > 0 ? scrollTop / max : 0)
}

onMounted(() => {
  document.addEventListener('scroll', onScroll, { capture: true, passive: true })
})
onUnmounted(() => {
  document.removeEventListener('scroll', onScroll, { capture: true })
  clearTimers()
})
</script>

<style scoped>
.top-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  transform-origin: 0 50%;
  background: rgb(var(--v-theme-primary));
  box-shadow: 0 0 8px rgba(var(--v-theme-primary), 0.6);
  z-index: 3000;
  pointer-events: none;
  will-change: transform, opacity;
  transition:
    transform 0.15s ease,
    opacity 0.3s ease;
}
/* While loading let the width ease a bit more slowly (matches the trickle). */
.top-progress--loading {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
</style>
