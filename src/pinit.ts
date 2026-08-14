import { getPkgTool, jsShell } from 'lazy-js-utils/node'
import { runGuardedChild } from './utils'
// package init
export async function pinit() {
  console.log('Initializing project...')
  switch (await getPkgTool()) {
    case 'npm':
      await runGuardedChild(() => jsShell('npm init -y'))
      return
    case 'yarn':
      await runGuardedChild(() => jsShell('yarn init -y'))
      return
    case 'pnpm':
      await runGuardedChild(() => jsShell('pnpm init -y'))
      return
    default:
      await runGuardedChild(() => jsShell('npm init -y'))
  }
}
