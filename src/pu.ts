import { jsShell } from 'lazy-js-utils/node'
import pc from 'picocolors'

export function pu(params = '') {
  console.warn(
    pc.yellow(
      '[pi] `pu` is deprecated and will be removed in a future release. Use `pil` for latest upgrades, or install/use `nu` directly.',
    ),
  )

  return jsShell(`nu${params ? ` ${params}` : ''}`)
}
