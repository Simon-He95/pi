import path from 'node:path'
import process from 'node:process'
import { isFile } from 'lazy-js-utils'
import { getPkgTool } from 'lazy-js-utils/node'

export type PkgTool = string

function normalizeDir(dir: string) {
  return path.resolve(dir)
}

function findUpSync(startDir: string, predicate: (dir: string) => boolean) {
  let current = normalizeDir(startDir)
  while (true) {
    if (predicate(current))
      return current
    const parent = path.dirname(current)
    if (parent === current)
      return null
    current = parent
  }
}

function inferToolFromRepoLayout(cwd: string): PkgTool | null {
  // Prefer pnpm when a pnpm workspace/lockfile exists in any parent.
  if (
    findUpSync(cwd, dir =>
      isFile(path.join(dir, 'pnpm-workspace.yaml'))
      || isFile(path.join(dir, 'pnpm-lock.yaml')))
  ) {
    return 'pnpm'
  }

  // Yarn classic / berry.
  if (
    findUpSync(cwd, dir =>
      isFile(path.join(dir, 'yarn.lock'))
      || isFile(path.join(dir, '.yarnrc.yml')))
  ) {
    return 'yarn'
  }

  // Bun.
  if (findUpSync(cwd, dir => isFile(path.join(dir, 'bun.lockb'))))
    return 'bun'

  return null
}

export async function resolvePkgTool() {
  let detected = (await getPkgTool()) || 'npm'
  if (detected === 'npm') {
    const inferred = inferToolFromRepoLayout(process.cwd())
    if (inferred)
      detected = inferred
  }
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
