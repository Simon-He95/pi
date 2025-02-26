import { getPkgTool, jsShell } from 'lazy-js-utils/node'
// package init
export async function pinit() {
  console.log('Initializing project...')
  switch (await getPkgTool()) {
    case 'npm':
      jsShell('npm init -y')
      return
    case 'yarn':
      jsShell('yarn init -y')
      return
    case 'pnpm':
      jsShell('pnpm init -y')
      return
    default:
      jsShell('npm init -y')
  }
}
