<template>
  <div>
    <slot />
    <hr>
    <slot name="nuxt" />
  </div>
</template>

<script setup>
const props = defineProps({
  hello: {
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
  }
})
const emit = defineEmits(['change', 'delete'])

</script>
