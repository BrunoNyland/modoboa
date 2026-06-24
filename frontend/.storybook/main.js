/**
 * Storybook (Vue 3 + Vite) — desenvolvimento de componentes isolados.
 *
 * NOTA: este scaffold foi commitado sem ser executado no CI (o ambiente onde
 * foi gerado não conseguiu instalar o Storybook). Depois de instalar as deps
 * (ver DEV_SEM_BACKEND.md), rode `yarn storybook` e ajuste se necessário.
 */

/** @type { import('@storybook/vue3-vite').StorybookConfig } */
const config = {
  stories: [
    '../src/**/*.stories.@(js|jsx)',
    '../.storybook/**/*.stories.@(js|jsx)',
  ],
  addons: [],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  // O Storybook reutiliza o vite.config.js do projeto. O host usa Module
  // Federation e um passo de relocação de bootstrap que não fazem sentido (e
  // atrapalham) ao servir componentes isolados — removemos esses plugins aqui.
  // O plugin de traduções (virtual:modoboa-translations) é mantido porque o
  // plugin de gettext depende dele.
  async viteFinal(viteConfig) {
    if (Array.isArray(viteConfig.plugins)) {
      const drop = (p) => {
        const name = p && (p.name || (p.length && p[0] && p[0].name))
        return (
          typeof name === 'string' &&
          (name.includes('federation') ||
            name.includes('modoboa-relocate-mf-bootstrap'))
        )
      }
      viteConfig.plugins = viteConfig.plugins.filter((p) => !drop(p))
    }
    return viteConfig
  },
}

export default config
