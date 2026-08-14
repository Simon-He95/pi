import { getPkgTool, jsShell } from 'lazy-js-utils/node'
import { runGuardedChild } from './utils'

// npx
export async function pix(params: string) {
  switch (await getPkgTool()) {
    case 'bun':
      return runGuardedChild(() => jsShell(`bunx ${params}`))
    default:
      return runGuardedChild(() => jsShell(`npx ${params}`))
  }
}
