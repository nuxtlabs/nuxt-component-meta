<template>
  <pre>{{ meta }}</pre>
</template>

<script>
import { getComponent } from '#component-meta'
export default {
  props: {
    of: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      meta: getComponent(this.of)
    }
  }
}
</script>
