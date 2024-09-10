<template>
  <div>
    <slot />
    <hr>
    <slot name="nuxt" />
  </div>
</template>

<script setup>
defineProps({
  hello: {
    type: String,
    default: 'Hello'
  }
})
defineEmits(['change', 'delete'])

</script>
