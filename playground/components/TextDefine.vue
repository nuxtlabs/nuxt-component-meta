<template>
  <div>
    <h1>Title</h1>
    <p>
      <slot />
    </p>
  </div>
</template>

<script lang="ts">
import type { PropType, defineComponent, type SlotsType } from 'vue'

export default defineComponent({
  name: 'TextDefine',
  slots: Object as SlotsType<{
    default: any
  }>,
  props: {
    title: {
      type: String,
      default: 'Title'
    },
    canvas: {
      type: Object as PropType<HTMLCanvasElement>,
      required: true
    }
  }
})
</script>
