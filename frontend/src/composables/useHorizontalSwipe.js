import { onBeforeUnmount, ref, unref, watch } from 'vue'

/**
 * Decide, from the first bit of pointer movement, whether the gesture is a
 * horizontal swipe (we handle it) or a vertical scroll (the browser handles
 * it). Kept pure and exported so the angle logic can be unit-tested.
 *
 * @returns {'horizontal'|'vertical'|null} null while still below the slop
 *   threshold (undecided).
 */
export function decideIntent(dx, dy, { slop = 8, ratio = 1.75 } = {}) {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ax < slop && ay < slop) {
    return null
  }
  return ax > ay * ratio ? 'horizontal' : 'vertical'
}

function clampOffset(dx, { triggerPx, maxOffsetPx }) {
  // 1:1 until the trigger threshold, then damped so it rubber-bands.
  const sign = Math.sign(dx)
  const abs = Math.abs(dx)
  if (abs <= triggerPx) {
    return dx
  }
  const damped = triggerPx + (abs - triggerPx) * 0.4
  return sign * Math.min(damped, maxOffsetPx)
}

/**
 * Touch-only horizontal swipe on an element. Vertical intent is left to the
 * browser (the row must have `touch-action: pan-y`), so scrolling is never
 * hijacked. Desktop mouse/pointer is ignored (pointerType !== 'touch').
 *
 * @param {import('vue').Ref<HTMLElement|null>} targetRef
 * @param {object} options
 * @returns {{ offsetX: Ref<number>, swiping: Ref<boolean>, armed: Ref<'left'|'right'|null> }}
 */
export function useHorizontalSwipe(targetRef, options = {}) {
  const {
    enabled = true,
    triggerPx = 72,
    intentSlopPx = 8,
    intentRatio = 1.75,
    maxOffsetPx = 120,
    onTrigger = () => {},
  } = options

  const offsetX = ref(0)
  const swiping = ref(false)
  const armed = ref(null)

  let startX = 0
  let startY = 0
  let intent = null
  let pointerId = null
  let el = null

  const isEnabled = () => unref(enabled)

  const reset = () => {
    offsetX.value = 0
    swiping.value = false
    armed.value = null
    intent = null
    pointerId = null
  }

  const onPointerDown = (e) => {
    if (!isEnabled() || e.pointerType !== 'touch' || !e.isPrimary) {
      return
    }
    startX = e.clientX
    startY = e.clientY
    intent = null
    pointerId = e.pointerId
  }

  const onPointerMove = (e) => {
    if (pointerId === null || e.pointerId !== pointerId) {
      return
    }
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (intent === null) {
      intent = decideIntent(dx, dy, {
        slop: intentSlopPx,
        ratio: intentRatio,
      })
      if (intent === 'vertical') {
        // Let the browser scroll; disengage for this gesture.
        pointerId = null
        return
      }
      if (intent === 'horizontal') {
        swiping.value = true
        el.setPointerCapture?.(e.pointerId)
      }
    }
    if (intent === 'horizontal') {
      offsetX.value = clampOffset(dx, { triggerPx, maxOffsetPx })
      armed.value =
        Math.abs(dx) >= triggerPx ? (dx < 0 ? 'left' : 'right') : null
    }
  }

  const onPointerUp = (e) => {
    if (pointerId === null || e.pointerId !== pointerId) {
      return
    }
    const direction = armed.value
    reset()
    if (direction) {
      onTrigger(direction)
    }
  }

  const onPointerCancel = () => {
    reset()
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
    el.addEventListener('pointercancel', onPointerCancel)
  }

  const detach = () => {
    if (!el) {
      return
    }
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerup', onPointerUp)
    el.removeEventListener('pointercancel', onPointerCancel)
    el = null
  }

  watch(targetRef, (node) => attach(node), { immediate: true })
  onBeforeUnmount(detach)

  return { offsetX, swiping, armed }
}
