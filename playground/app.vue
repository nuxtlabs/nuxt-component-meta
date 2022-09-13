<template>
  <div>
    <div>
      <TestComponent foo="test" />
      <TestGlobalComponent />
      <TestTyped :hello="`test`" />
    </div>

    <h2>Components from <code>/api/component-meta</code> nitro route</h2>
    <!-- <pre>{{ data }}</pre> -->
    <hr>
    <h2>Components from <code>#nuxt-component-meta</code> virtual module</h2>
    <pre>{{ components }}</pre>
  </div>
</template>

<script setup>
import TestComponent from './components/TestComponent.vue'
import TestTyped from './components/testTyped.vue'
import { components } from '#component-meta'
// const { data } = await useAsyncData('metas', () => $fetch('/api/component-meta'))
</script>
