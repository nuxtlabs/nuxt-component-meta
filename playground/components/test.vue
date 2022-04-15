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
  }
})
const emit = defineEmits(['change', 'delete'])

</script>
