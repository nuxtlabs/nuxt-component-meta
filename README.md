# Nuxt Component Meta

> Gather components metadata on build time and make them available on production

💡 This module depends on `nuxt3`

## Quick Setup

1. Add `nuxt-component-meta` dependency to your project:

```bash
# Using Yarn
yarn add --dev nuxt-component-meta
# Using NPM
npm install --save-dev nuxt-component-meta
```

2. Add `nuxt-component-meta` to the `modules` section of your `nuxt.config.js`

```ts
{
  modules: ['nuxt-component-meta']
}
```

## Usage

```html
<template>
  <div>
    <h2>`MyComponent` metadata</h2>
    <pre>
      {{ meta }}
    </pre>
  </div>
</template>

<script script>
const { data: meta } = await useAsyncData('my-component', () => $fetch('/api/component-meta/my-component'))
</script>
```

## Development

1. Clone this repository
2. Install dependencies using `yarn install`
3. Start dev server using `yarn dev`
