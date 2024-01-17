<template>
  <div>
    Dummy component to test useSlots
  </div>
</template>

<script setup lang="ts">
const { title, default: dd } = useSlots()
</script>
