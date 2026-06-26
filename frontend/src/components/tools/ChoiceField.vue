<template>
  <div
    class="text-subtitle-1 text-medium-emphasis mb-5"
    :class="{ 'label--disabled': disabled }"
  >
    <label class="m-label">{{ label }}</label>
  </div>
  <div
    v-for="(lineChoices, index1) in formatedChoices"
    :key="index1"
    class="d-flex flex-grow-0"
  >
    <div
      v-for="(choice, index2) in lineChoices"
      :key="index2"
      class="choice rounded pa-10 mr-4 text-center flex-grow-0 mb-4"
      :class="{
        'choice--disabled': disabled,
        'choice--selected': !disabled && currentChoice === choice.value,
      }"
      @click="selectChoice(choice.value)"
    >
      <v-icon
        v-if="choice.icon"
        class="d-block mb-2 mx-auto"
        :color="iconColor(choice.value)"
        size="x-large"
        :icon="choice.icon"
      />
      <span class="choice__label">{{ choice.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
  modelValue: { type: [Number, String], default: null },
  label: { type: String, default: '' },
  choices: { type: Array, default: () => [] },
  disabled: {
    type: Boolean,
    default: false,
  },
  choicesPerLine: {
    type: Number,
    required: false,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const currentChoice = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  },
})

const formatedChoices = ref([])

function formatChoices() {
  if (props.choicesPerLine) {
    let sliceIndex = 0
    while (sliceIndex < props.choices.length) {
      const result = props.choices.slice(
        sliceIndex,
        sliceIndex + props.choicesPerLine
      )
      formatedChoices.value.push(result)
      sliceIndex += props.choicesPerLine
    }
  } else {
    formatedChoices.value.push(props.choices)
  }
}

function iconColor(value) {
  return !props.disabled && value === currentChoice.value ? 'primary' : ''
}
function selectChoice(value) {
  if (props.disabled) {
    return
  }
  currentChoice.value = value
}

onMounted(() => {
  formatChoices()
})
</script>

<style lang="scss" scoped>
.choice {
  flex-basis: 200px;
  background-color: var(--bg-2);
  border: 1px solid var(--line-2);
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s;

  &:hover {
    background-color: #1a1a1a;
  }

  &--selected {
    border-color: var(--accent) !important;
    background-color: rgba(124, 92, 255, 0.08);
  }

  &--disabled {
    cursor: unset;
    opacity: 0.5;
  }
}
.choice__label {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--fg);
}
.label--disabled {
  opacity: 0.5;
}
</style>
