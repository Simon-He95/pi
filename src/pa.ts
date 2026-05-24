import { jsShell } from 'lazy-js-utils/node'
import pc from 'picocolors'

export function pa(params = '') {
  console.warn(
    pc.yellow(
      '[pi] `pa` is deprecated and will be removed in a future release. Use `pi --show-tool` / `pi --choose-tool`, or install/use `na` directly.',
    ),
  )

  return jsShell(`na${params ? ` ${params}` : ''}`)
}
