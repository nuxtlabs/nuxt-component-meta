import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  components: {
    dirs: [
      {
        path: '~/components/global',
        global: true
      },
      '~/components'
    ]
  },
  modules: [
    '@nuxt/content',
    'nuxt-component-meta'
  ]
})
