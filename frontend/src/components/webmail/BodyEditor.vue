<template>
  <div class="d-flex flex-column flex-grow-1">
    <div class="d-flex align-center mt-4 mb-2">
      <v-btn
        :variant="htmlMode ? 'flat' : 'outlined'"
        color="primary"
        size="small"
        prepend-icon="mdi-code-tags"
        @click="toggleHtmlMode"
      >
        HTML
      </v-btn>
    </div>

    <HtmlEditor
      v-if="htmlMode"
      v-model="model"
      class="d-flex flex-column flex-grow-1"
    />
    <v-textarea
      v-else
      v-model="model"
      variant="outlined"
      class="flex-grow-1"
      :placeholder="$gettext('Write your message here...')"
      auto-grow
      rows="15"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import HtmlEditor from '@/components/tools/HtmlEditor'

const props = defineProps({
  editorMode: {
    type: String,
    default: null,
  },
})

const model = defineModel()
const emit = defineEmits(['onToggleHtmlMode'])

const htmlMode = ref(false)

const toggleHtmlMode = () => {
  htmlMode.value = !htmlMode.value
  emit('onToggleHtmlMode', htmlMode.value)
}

watch(
  () => props.editorMode,
  (value) => {
    htmlMode.value = value === 'html'
  }
)
</script>

<style scoped lang="scss">
</style>
