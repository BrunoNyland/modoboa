import { onBeforeUnmount, ref, watch } from 'vue'

/**
 * Touch-only pull-to-refresh on a scroll container. Engages only when the
 * container is already at the top and the finger moves down; drives a pull
 * indicator and calls `onRefresh` past the threshold. Only the indicator is
 * translated (not the list), which keeps it cheap and avoids fighting the
 * list's own scrolling.
 *
 * @param {import('vue').Ref<HTMLElement|null>} containerRef
 * @param {{ onRefresh: () => Promise<void>|void, thresholdPx?: number, maxPullPx?: number }} options
 * @returns {{ pullPx: Ref<number>, refreshing: Ref<boolean> }}
 */
export function usePullToRefresh(containerRef, options = {}) {
  const { onRefresh = () => {}, thresholdPx = 70, maxPullPx = 110 } = options

  const pullPx = ref(0)
  const refreshing = ref(false)

  let startY = 0
  let engaged = false
  let pointerId = null
  let el = null

  const reset = () => {
    pullPx.value = 0
    engaged = false
    pointerId = null
  }

  const onPointerDown = (e) => {
    if (e.pointerType !== 'touch' || !e.isPrimary || refreshing.value) {
      return
    }
    if (el.scrollTop > 0) {
      return
    }
    startY = e.clientY
    pointerId = e.pointerId
    engaged = false
  }

  const onPointerMove = (e) => {
    if (pointerId === null || e.pointerId !== pointerId) {
      return
    }
    const dy = e.clientY - startY
    // Only engage on a downward pull while still pinned to the top.
    if (!engaged) {
      if (dy > 6 && el.scrollTop <= 0) {
        engaged = true
      } else if (dy <= 0) {
        pointerId = null
        return
      }
    }
    if (engaged) {
      // Resistance: the pull lags the finger and caps out.
      pullPx.value = Math.min(dy * 0.5, maxPullPx)
    }
  }

  const onPointerUp = async (e) => {
    if (pointerId === null || e.pointerId !== pointerId) {
      return
    }
    const shouldRefresh = pullPx.value >= thresholdPx
    if (shouldRefresh) {
      refreshing.value = true
      pullPx.value = thresholdPx
      try {
        await onRefresh()
      } finally {
        refreshing.value = false
        reset()
      }
    } else {
      reset()
    }
  }

  const attach = (node) => {
    if (el === node) {
      return
    }
    detach()
    el = node
    if (!el) {
      return
    }
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', reset)
  }

  const detach = () => {
    if (!el) {
      return
    }
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerup', onPointerUp)
    el.removeEventListener('pointercancel', reset)
    el = null
  }

  watch(containerRef, (node) => attach(node), { immediate: true })
  onBeforeUnmount(detach)

  return { pullPx, refreshing }
}
