const { jsWithBabelESM: tsjPreset } = require('ts-jest/presets')

module.exports = {
  preset: 'ts-jest',
  transform: {
    ...tsjPreset.transform
  },
  // TODO: Fix coverage
  collectCoverage: false,
  collectCoverageFrom: ['src/**', '!templates/**', '!example/**', '!.nuxt/**'],
  coveragePathIgnorePatterns: ['node_modules', '.nuxt']
}
