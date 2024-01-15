<template>
  <div>
    Dummy component to test useSlots
  </div>
</template>

<script setup lang="ts">
const slots = useSlots()

const defaultSlot = computed(() => slots.default?.())

</script>
