import { getPkgTool, jsShell } from 'lazy-js-utils/node'
// package init
export async function pinit() {
  console.log('Initializing project...')
  switch (await getPkgTool()) {
    case 'npm':
      await jsShell('npm init -y')
      return
    case 'yarn':
      await jsShell('yarn init -y')
      return
    case 'pnpm':
      await jsShell('pnpm init -y')
      return
    default:
      await jsShell('npm init -y')
  }
}
