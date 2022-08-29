<template>
  <div>
    <h2>Components from <code>/api/component-meta</code> nitro route</h2>
    <pre>{{ data }}</pre>
    <hr />
    <h2>Components from <code>#nuxt-component-meta</code> virtual module</h2>
    <pre>{{ components }}</pre>
    <NuxtWelcome />
    <NuxtLayout />
    <NuxtLoadingIndicator />
  </div>
</template>

<script setup>
import components from '#nuxt-component-meta'
const { data } = await useAsyncData('metas', () => $fetch('/api/component-meta'))
</script>
