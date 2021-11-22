import { resolve } from 'pathe'
import { defineNuxtConfig } from 'nuxt3'

export default defineNuxtConfig({
  buildModules: [resolve(__dirname, '../src/module.ts')]
})
