import nuxtMetaModule from 'nuxt-component-meta'

export default defineNuxtConfig({
  components: {
    dirs: [
      {
        path: '~/components/global',
        prefix: '',
        global: true
      },
      '~/components'
    ]
  },
  modules: [
    nuxtMetaModule
  ]
})
