import nuxtMetaModule from '../../../src/module'

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
