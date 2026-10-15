// Simple bus to handle global events like sending notifications to the user
import { defineStore } from 'pinia'
import { ref } from 'vue'

const DEFAULT_TIMEOUT = 2000

export const useBusStore = defineStore('bus', () => {
  const notification = ref('')
  const notificationColor = ref('')
  const notificationTimeout = ref(DEFAULT_TIMEOUT)
  // Optional { label, handler } rendered as an extra snackbar button
  // (e.g. "Undo"). Cleared on every notification that doesn't provide one,
  // so an action never leaks into an unrelated message.
  const notificationAction = ref(null)
  const dataKey = ref(1)
  const mbCounterKey = ref(1)
  // Last optimistic change of the folder counters:
  // { changes: [{ mailbox, total, unseen }] } (deltas)
  const mbCounterAdjustment = ref(null)

  async function $reset() {
    notification.value = ''
    notificationColor.value = ''
    notificationTimeout.value = DEFAULT_TIMEOUT
    notificationAction.value = null
    dataKey.value = 1
    mbCounterKey.value = 1
    mbCounterAdjustment.value = null
  }

  function displayNotification(options) {
    notification.value = options.msg
    notificationColor.value = options.type ? options.type : 'success'
    notificationTimeout.value =
      options.timeout !== undefined ? options.timeout : DEFAULT_TIMEOUT
    notificationAction.value = options.action || null
  }

  function hideNotification() {
    notification.value = ''
    notificationAction.value = null
  }

  function reloadData() {
    dataKey.value++
  }

  function reloadMailboxCounters() {
    mbCounterKey.value++
  }

  // Apply deltas to the folder counters right away, before the server
  // knows (deferred actions such as a swipe-delete with Undo). A reload
  // replaces them with the real numbers.
  function adjustMailboxCounters(changes) {
    mbCounterAdjustment.value = { changes }
  }

  return {
    notification,
    notificationColor,
    notificationTimeout,
    notificationAction,
    displayNotification,
    hideNotification,
    reloadMailboxCounters,
    adjustMailboxCounters,
    mbCounterAdjustment,
    dataKey,
    mbCounterKey,
    reloadData,
    $reset,
  }
})
