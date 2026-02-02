import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hasPkg = vi.fn()
const isGo = vi.fn()
const isRust = vi.fn()
const jsShell = vi.fn()
const useNodeWorker = vi.fn()
const getPkgTool = vi.fn()
const getPkg = vi.fn()
const isInstallPkg = vi.fn()

const help = vi.fn()
const installDeps = vi.fn()

vi.mock('lazy-js-utils/node', () => ({
  hasPkg,
  isGo,
  isRust,
  jsShell,
  useNodeWorker,
  getPkgTool,
  getPkg,
  isInstallPkg,
}))

vi.mock('../src/help', () => ({ help }))
vi.mock('../src/installDeps', () => ({ installDeps }))

const originalArgv = process.argv

beforeEach(() => {
  vi.resetModules()
  help.mockResolvedValue(undefined)
  installDeps.mockResolvedValue(undefined)
  hasPkg.mockResolvedValue(true)
  isGo.mockResolvedValue(false)
  isRust.mockResolvedValue(false)
  process.env.PI_TEST = 'true'
})

afterEach(() => {
  process.argv = originalArgv
  delete process.env.PI_TEST
  vi.clearAllMocks()
})

describe('setup command guard', () => {
  it('does not run deps for pbuild in node projects', async () => {
    process.argv = ['node', '/usr/local/bin/pbuild', 'arg1']
    const { setup } = await import('../src/index')
    await expect(setup()).resolves.toBeUndefined()
    expect(installDeps).not.toHaveBeenCalled()
  })

  it('does not run deps for unknown commands', async () => {
    process.argv = ['node', '/usr/local/bin/punknown', 'arg1']
    const { setup } = await import('../src/index')
    await expect(setup()).resolves.toBeUndefined()
    expect(installDeps).not.toHaveBeenCalled()
  })
})
