import { defineNuxtConfig } from 'nuxt'
import nuxtMetaModule from '../src/module'

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
    nuxtMetaModule
  ]
})
