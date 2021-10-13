# Nuxt Component Meta

> Gather components metadata on build time and make them available on production

💡 This module depends on `@nuxt/bridge`

## Quick Setup

1. Add `nuxt-component-meta` dependency to your project:

```bash
# Using Yarn
yarn add --dev nuxt-component-meta
# Using NPM
npm install --save-dev nuxt-component-meta
```

2. Add `nuxt-component-meta/module` to the `buildModules` section of your `nuxt.config.js`

```ts
{
  buildModules: ['nuxt-component-meta/module']
}
```

## Usage

```html
<template>
  <div>
    <h2>`MyComponent` metadata</h2>
    <pre>
      {{ component }}
    </pre>
  </div>
</template>

<script>
import { getComponent } from 'nuxt-component-meta'

export default {
  data() {
    return {
      meta: getComponent('my-component')
    }
  }
}
</script>
```

## Development

1. Clone this repository
2. Install dependencies using `yarn install`
3. Start dev server using `yarn dev`
