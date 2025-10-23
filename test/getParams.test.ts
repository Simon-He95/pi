import { describe, expect, it, beforeEach, vi } from 'vitest'

// Control flags for mocks
let pkgTool: 'pnpm' | 'yarn' | 'npm' = 'pnpm'
let pnpmWorkspace = false
let yarnWorkspaces = false

vi.mock('lazy-js-utils/node', () => ({
  getPkgTool: async () => pkgTool,
  getPkg: async () => (yarnWorkspaces ? { workspaces: ['packages/*'] } : {}),
  jsShell: vi.fn(),
}))

vi.mock('lazy-js-utils', () => ({
  isFile: (p: string) => (p.includes('pnpm-workspace.yaml') ? pnpmWorkspace : false),
}))

// Import after mocks
import { getParams } from '../src/utils'

beforeEach(() => {
  pkgTool = 'pnpm'
  pnpmWorkspace = false
  yarnWorkspaces = false
})

describe('getParams flag mapping', () => {
  it('pnpm non-workspace: -d -> -D', async () => {
    pkgTool = 'pnpm'
    pnpmWorkspace = false
    const res = await getParams('foo -d')
    expect(res).toBe('foo -D')
  })

  it('pnpm workspace: -d -> -Dw', async () => {
    pkgTool = 'pnpm'
    pnpmWorkspace = true
    const res = await getParams('foo -d')
    expect(res).toBe('foo -Dw')
  })

  it('yarn non-workspace: -d -> -D', async () => {
    pkgTool = 'yarn'
    yarnWorkspaces = false
    const res = await getParams('foo -d')
    expect(res).toBe('foo -D')
  })

  it('yarn workspace: -d -> -DW', async () => {
    pkgTool = 'yarn'
    yarnWorkspaces = true
    const res = await getParams('foo -d')
    expect(res).toBe('foo -DW')
  })

  it('npm default: -d -> -D', async () => {
    pkgTool = 'npm'
    const res = await getParams('foo -d')
    expect(res).toBe('foo -D')
  })
})
