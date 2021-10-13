<template>
  <pre>
    {{ component }}
  </pre>
</template>

<script>
import { getComponent } from '#component-meta'
export default {
  props: {
    name: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      component: getComponent(this.name)
    }
  }
}
</script>
