import nuxtMetaModule from '../../..'

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
