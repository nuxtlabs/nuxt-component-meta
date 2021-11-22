<template>
  <pre>{{ meta }}</pre>
</template>

<script setup>
import { getComponent } from '#component-meta'

const meta = getComponent('MyComponent')
</script>
