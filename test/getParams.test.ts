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
  isFile: (p: string) =>
    p.includes('pnpm-workspace.yaml') ? pnpmWorkspace : false,
}))

async function importGetParams() {
  const mod = await import('../src/utils')
  return mod.getParams
}

beforeEach(() => {
  vi.resetModules()
  pkgTool = 'pnpm'
  pnpmWorkspace = false
  yarnWorkspaces = false
})

describe('getParams flag mapping', () => {
  it('pnpm non-workspace: -d -> -D', async () => {
    pkgTool = 'pnpm'
    pnpmWorkspace = false
    const getParams = await importGetParams()
    const res = await getParams('foo -d')
    expect(res).toBe('foo -D')
  })

  it('pnpm workspace: -d -> -Dw', async () => {
    pkgTool = 'pnpm'
    pnpmWorkspace = true
    const getParams = await importGetParams()
    const res = await getParams('foo -d')
    expect(res).toBe('foo -Dw')
  })

  it('yarn non-workspace: -d -> -D', async () => {
    pkgTool = 'yarn'
    yarnWorkspaces = false
    const getParams = await importGetParams()
    const res = await getParams('foo -d')
    expect(res).toBe('foo -D')
  })

  it('yarn workspace: -d -> -DW', async () => {
    pkgTool = 'yarn'
    yarnWorkspaces = true
    const getParams = await importGetParams()
    const res = await getParams('foo -d')
    expect(res).toBe('foo -DW')
  })

  it('npm default: -d -> -D', async () => {
    pkgTool = 'npm'
    const getParams = await importGetParams()
    const res = await getParams('foo -d')
    expect(res).toBe('foo -D')
  })

  it('infer pnpm workspace when detected npm: -d -> -Dw', async () => {
    pkgTool = 'npm'
    pnpmWorkspace = true
    const getParams = await importGetParams()
    const res = await getParams('foo -d')
    expect(res).toBe('foo -Dw')
  })
})
