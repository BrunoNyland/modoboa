<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>{{ title }}</v-toolbar-title>
    </v-toolbar>

    <ParametersForm
      :key="$route.params.app"
      :app="$route.params.app"
      :structure="structure"
      :values="parameters"
      :save-function="parametersApi.saveGlobalApplication"
      @success="onSuccess"
    >
      <template
        #widget-ImageField="{
          param,
          modelValue,
          updateModelValue,
          errorMessage,
        }"
      >
        <ImageFieldWidget
          :model-value="modelValue"
          :label="param.label"
          :help-text="param.help_text"
          :uploading="!!imageState[param.name]?.uploading"
          :clearing="!!imageState[param.name]?.clearing"
          :error-message="errorMessage"
          @upload="(file) => onImageUpload(param.name, file, updateModelValue)"
          @clear="() => onImageClear(param.name, updateModelValue)"
        />
      </template>
    </ParametersForm>
  </div>
</template>

<script setup>
import parametersApi from '@/api/parameters'
import { computed, reactive, ref, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useRoute } from 'vue-router'
import { useGlobalStore, useParametersStore, useBusStore } from '@/stores'
import ParametersForm from '@/components/tools/ParametersForm'
import ImageFieldWidget from '@/components/tools/ImageFieldWidget'

const { $gettext } = useGettext()
const globalStore = useGlobalStore()
const { displayNotification } = useBusStore()
const route = useRoute()
const parametersStore = useParametersStore()

const structure = ref([])
const parameters = ref({})
const label = ref('')

const title = computed(() => $gettext('Settings: ' + label.value))

// Per-parameter upload/clear status used by the ImageField widget slot.
const imageState = reactive({})

function themeLogoType(paramName) {
  return null
}

async function onImageUpload(paramName, file, updateModelValue) {
  // No-op: theme system removed
}

async function onImageClear(paramName, updateModelValue) {
  // No-op: theme system removed
}

function loadParams(app) {
  parametersApi.getGlobalApplicationStructure(app).then((response) => {
    structure.value = response.data
  })
  parametersApi.getGlobalApplication(app).then((response) => {
    parameters.value = response.data.params
    label.value = response.data.label
  })
}

function onSuccess(newValues) {
  globalStore.fetchNotifications()
  if (route.params.app === 'imap_migration') {
    parametersStore.imapMigrationEnabled = newValues.enabled_imapmigration
  }
}

watch(route, (toRoute) => {
  loadParams(toRoute.params.app)
})

loadParams(route.params.app)
</script>

<style scoped>
.v-toolbar {
  background-color: rgb(var(--v-theme-background)) !important;
}
.error_tab {
  color: #ff5252 !important;
}
</style>

<style>
.v-window__container {
  width: 100% !important;
}
</style>
