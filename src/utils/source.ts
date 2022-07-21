/**
 * find `$slots.*` usage in the source code
 */
export function findSlotUsage (source: string) {
  const slots: any[] = []
  // Detect `$slots` usage
  const $slots = source.matchAll(/\$slots(\.([-_\w]+)|\[['"]([-_\w]+)['"]\])/g)
  let $slot = $slots.next()
  while (!$slot.done) {
    slots.push({
      name: $slot.value[2] || $slot.value[3]
    })
    $slot = $slots.next()
  }
  return slots
}
