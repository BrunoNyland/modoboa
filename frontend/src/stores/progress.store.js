// Drives the global top progress bar. It blends two signals:
//  - loading: in-flight API requests (axios) + route navigation (router);
//  - scroll: reading progress (0..1) of the current scroll container.
// The bar shows a trickle animation while loading and the scroll ratio when idle.
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProgressStore = defineStore('progress', () => {
  // Number of in-flight API requests. A counter (not a boolean) so concurrent
  // requests don't clear each other; balanced by stop on every settle.
  const loadingCount = ref(0)
  // Route navigation in progress. A boolean (can't get stuck-incremented by a
  // cancelled/redirected navigation the way a counter could).
  const navigating = ref(false)
  // Reading progress of the active scroll container, 0..1.
  const scroll = ref(0)

  const isLoading = computed(() => loadingCount.value > 0 || navigating.value)

  function startLoading() {
    loadingCount.value++
  }
  function stopLoading() {
    if (loadingCount.value > 0) {
      loadingCount.value--
    }
  }
  function setNavigating(value) {
    navigating.value = value
  }
  function setScroll(value) {
    scroll.value = Math.min(1, Math.max(0, value || 0))
  }

  async function $reset() {
    loadingCount.value = 0
    navigating.value = false
    scroll.value = 0
  }

  return {
    loadingCount,
    navigating,
    scroll,
    isLoading,
    startLoading,
    stopLoading,
    setNavigating,
    setScroll,
    $reset,
  }
})
