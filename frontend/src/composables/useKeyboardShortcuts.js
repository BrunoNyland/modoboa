import { onMounted, onUnmounted, toValue } from 'vue'

// Typing surfaces where single-key shortcuts must never fire. `.tiptap`
// covers the rich-text editor whose contenteditable lives on a child node.
const EDITABLE_SELECTOR =
  'input, textarea, select, [contenteditable="true"], .tiptap'

export function isEditableTarget(el) {
  return Boolean(
    el && typeof el.closest === 'function' && el.closest(EDITABLE_SELECTOR)
  )
}

// Pure guard so the decision logic is unit-testable without a DOM: shortcuts
// only fire on plain keypresses (Shift allowed — `?` needs it), outside
// editable fields, with no overlay (dialog/menu) open.
export function shouldHandleKey(event, { overlayOpen = false } = {}) {
  if (event.defaultPrevented) {
    return false
  }
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false
  }
  if (overlayOpen) {
    return false
  }
  if (isEditableTarget(event.target)) {
    return false
  }
  return true
}

export function findBinding(bindings, key) {
  return bindings.find((b) => b.keys.includes(key)) || null
}

/**
 * Register global keyboard shortcuts for the lifetime of the calling
 * component.
 *
 * bindings: [{ keys: ['j'], description: '...', handler: fn }]
 * options.enabled: Ref<boolean> | boolean — e.g. desktop-only.
 *
 * Returns the bindings array (used to feed the help dialog).
 */
export function useKeyboardShortcuts(bindings, options = {}) {
  const onKeydown = (event) => {
    if (options.enabled !== undefined && !toValue(options.enabled)) {
      return
    }
    // Snackbars are v-overlays too, but they're passive notifications —
    // don't let a 5s "Undo" toast swallow shortcuts.
    const overlayOpen = Boolean(
      document.querySelector('.v-overlay--active:not(.v-snackbar)')
    )
    if (!shouldHandleKey(event, { overlayOpen })) {
      return
    }
    const binding = findBinding(bindings, event.key)
    if (binding) {
      event.preventDefault()
      binding.handler(event)
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))

  return bindings
}
