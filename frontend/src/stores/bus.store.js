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

  async function $reset() {
    notification.value = ''
    notificationColor.value = ''
    notificationTimeout.value = DEFAULT_TIMEOUT
    notificationAction.value = null
    dataKey.value = 1
    mbCounterKey.value = 1
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

  return {
    notification,
    notificationColor,
    notificationTimeout,
    notificationAction,
    displayNotification,
    hideNotification,
    reloadMailboxCounters,
    dataKey,
    mbCounterKey,
    reloadData,
    $reset,
  }
})
