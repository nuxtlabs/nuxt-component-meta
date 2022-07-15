<template>
  <div>
    <slot />
    <hr>
    <slot name="nuxt" />

    <SomeComponent :prop="$slots.variable" />
  </div>
</template>

<script setup>
const props = defineProps({
  stringProp: {
    type: String,
    default: 'Hello'
  },
  booleanProp: {
    type: Boolean,
    default: false
  },
  numberProp: {
    type: Number,
    default: 1.3
  },
  arrayProp: {
    type: Array,
    default: () => []
  },
  objectProp: {
    type: Object,
    default: () => ({})
  }
})
const emit = defineEmits(['change', 'delete'])
</script>
