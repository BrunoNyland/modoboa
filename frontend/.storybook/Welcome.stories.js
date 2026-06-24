/**
 * História de exemplo — demonstra que o preview (Vuetify + tema do Modoboa)
 * está funcionando. Use-a como modelo para criar histórias dos seus
 * componentes em src/ (ex.: src/components/tools/ColorField.stories.js).
 *
 * Modelo para um componente real:
 *
 *   import ColorField from '@/components/tools/ColorField.vue'
 *   export default { title: 'Tools/ColorField', component: ColorField }
 *   export const Default = { args: { modelValue: '#046BF8' } }
 */

export default {
  title: 'Exemplo/Botões & Tema',
}

export const Botoes = {
  render: () => ({
    template: `
      <div class="d-flex flex-column ga-4" style="max-width: 420px">
        <div class="d-flex ga-2">
          <v-btn color="primary">Primário</v-btn>
          <v-btn color="secondary">Secundário</v-btn>
          <v-btn variant="outlined">Outline</v-btn>
        </div>
        <v-text-field label="Campo de texto" variant="outlined" />
        <v-alert type="info" text="O preview do Storybook está funcionando." />
      </div>
    `,
  }),
}
