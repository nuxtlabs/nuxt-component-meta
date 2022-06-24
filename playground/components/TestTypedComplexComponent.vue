<template>
  <div>
    <slot />
    <hr>
    <slot name="nuxt" />
  </div>
</template>

<script setup lang="ts">
import type { ExternalItem } from '~~/externalTypes'

export type TestTypedComplexComponentSize = 'small' | 'medium' | 'large'

export interface TestTypedComplexComponentProps {
  hello: string,
  booleanProp?: boolean,
  numberProp?: number,
  size?: TestTypedComplexComponentSize
  items?: ExternalItem[]
}
export interface TestTypedComplexComponentEmits {
  (event: 'change', value: any): void,
  (event: 'delete'): void,
}

const props = defineProps<TestTypedComplexComponentProps>()
const emit = defineEmits<TestTypedComplexComponentEmits>()
</script>
