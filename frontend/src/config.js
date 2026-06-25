let globalConfig = null

export function setGlobalConfig(config) {
  globalConfig = config
}

export function useGlobalConfig() {
  return globalConfig || {}
}
