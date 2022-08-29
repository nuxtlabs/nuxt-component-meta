import { defineNuxtConfig } from 'nuxt'
import nuxtMetaModule from 'nuxt-component-meta'

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
    nuxtMetaModule
  ]
})
