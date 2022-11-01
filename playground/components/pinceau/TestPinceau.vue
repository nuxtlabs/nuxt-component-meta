<template>
  <div>
    Hello World!
  </div>
</template>

<script setup lang="ts">
defineProps({
  ...variants
})
</script>

<style scoped lang="ts">
css({
  variants: {
    background: {
      red: {
        background: 'red',
      },
      blue: {
        background: 'blue',
      }
    }
  }
})
</style>
