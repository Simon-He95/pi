import process from 'node:process'
import { getPkgTool } from 'lazy-js-utils/node'

export type PkgTool = string

export async function resolvePkgTool() {
  const detected = (await getPkgTool()) || 'npm'
  const fallback = process.env.PI_DEFAULT
  const tool = detected === 'npm' && fallback ? fallback : detected
  return {
    detected,
    tool,
  }
}

export function getInstallCommand(tool: PkgTool, hasParams: boolean) {
  const action = hasParams ? 'add' : 'install'
  switch (tool) {
    case 'pnpm':
      return `pnpm ${action}`
    case 'yarn':
      return `yarn ${action}`
    case 'bun':
      return `bun ${action}`
    case 'npm':
      return 'npm install'
    default:
      return `${tool} ${action}`
  }
}

export function getRemoveCommand(tool: PkgTool) {
  switch (tool) {
    case 'pnpm':
      return 'pnpm remove'
    case 'yarn':
      return 'yarn remove'
    case 'bun':
      return 'bun remove'
    case 'npm':
      return 'npm uninstall'
    default:
      return `${tool} remove`
  }
}
