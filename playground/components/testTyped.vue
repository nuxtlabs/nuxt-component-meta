<template>
  <div>
    <slot />
    <hr>
    <slot name="nuxt" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  hello: string,
  booleanProp?: boolean,
  numberProp?: number
}>()
const emit = defineEmits(['change', 'delete'])

</script>
