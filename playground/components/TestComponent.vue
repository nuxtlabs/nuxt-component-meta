<template>
  <div>
    <slot />
    <hr>
    <slot name="nuxt" />
  </div>
</template>

<script setup>
defineProps({
  foo: {
    type: String,
    required: true
  },
  /**
   * The hello property.
   *
   * @since v1.0.0
   */
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
