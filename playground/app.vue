<template>
  <div>
    <div>
      <TestComponent foo="test" />
      <TestGlobalComponent />
      <TestTyped :hello="`test`" />
    </div>

    <h2>Components from <code>#nuxt-component-meta</code> virtual module</h2>

    <pre>{{ composableData }}</pre>

    <h2>Components from <code>/api/component-meta</code> nitro route</h2>

    <pre>{{ nitroData }}</pre>

    <hr>
  </div>
</template>

<script lang="ts" setup>
import TestComponent from './components/TestComponent.vue'
import TestTyped from './components/testTyped.vue'

const { data: nitroData } = await useAsyncData('metas', () => $fetch('/api/component-meta'))

const composableData = useComponentMeta()
</script>
