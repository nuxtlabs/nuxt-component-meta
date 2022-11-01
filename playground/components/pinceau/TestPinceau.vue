<template>
  <div :class="$pinceau">
    Hello World!
  </div>
</template>

<script setup lang="ts">
defineProps({
  ...$variantsProps
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
