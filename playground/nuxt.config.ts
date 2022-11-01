import nuxtMetaModule from '../src/module'

export default defineNuxtConfig({
  components: {
    dirs: [
      {
        path: '~/components/global',
        prefix: '',
        global: true
      },
      {
        path: '~/components/pinceau',
        prefix: '',
        global: true
      },
      '~/components'
    ]
  },
  modules: [
    '@nuxt/content',
    'pinceau/nuxt',
    nuxtMetaModule
  ],
  pinceau: {
    followSymbolicLinks: false
  }
})
