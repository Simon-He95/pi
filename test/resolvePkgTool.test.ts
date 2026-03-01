import { beforeEach, describe, expect, it, vi } from 'vitest'

let pkgTool: 'pnpm' | 'yarn' | 'npm' | 'bun' = 'npm'
let pnpmWorkspace = false
let yarnWorkspace = false
let bunLock = false

vi.mock('lazy-js-utils/node', () => ({
  getPkgTool: async () => pkgTool,
}))

vi.mock('lazy-js-utils', () => ({
  isFile: (p: string) => {
    if (p.includes('pnpm-workspace.yaml') || p.includes('pnpm-lock.yaml'))
      return pnpmWorkspace
    if (p.includes('yarn.lock') || p.includes('.yarnrc.yml'))
      return yarnWorkspace
    if (p.includes('bun.lockb'))
      return bunLock
    return false
  },
}))

import { resolvePkgTool } from '../src/pkgManager'

beforeEach(() => {
  pkgTool = 'npm'
  pnpmWorkspace = false
  yarnWorkspace = false
  bunLock = false
  delete process.env.PI_DEFAULT
})

describe('resolvePkgTool', () => {
  it('infers pnpm in a pnpm workspace even if detected npm', async () => {
    pkgTool = 'npm'
    pnpmWorkspace = true
    const res = await resolvePkgTool()
    expect(res.detected).toBe('pnpm')
    expect(res.tool).toBe('pnpm')
  })
})
