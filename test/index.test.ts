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
const resolvePkgTool = vi.fn()
const forgetPkgToolPreference = vi.fn()
const getPkgToolStatus = vi.fn()
const getSupportedPkgToolNames = vi.fn()
const printPkgToolCandidates = vi.fn()
const printPkgToolStatus = vi.fn()

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
vi.mock('../src/pkgManager', () => ({
  forgetPkgToolPreference,
  getPkgToolStatus,
  getSupportedPkgToolNames,
  printPkgToolCandidates,
  printPkgToolStatus,
  resolvePkgTool,
}))

const originalArgv = process.argv

function binPath(name: string) {
  return process.platform === 'win32'
    ? `C:\\tools\\${name}.cmd`
    : `/usr/local/bin/${name}`
}

beforeEach(() => {
  vi.resetModules()
  help.mockResolvedValue(undefined)
  installDeps.mockResolvedValue(undefined)
  resolvePkgTool.mockResolvedValue({ detected: 'pnpm', tool: 'pnpm', source: 'saved-preference' })
  forgetPkgToolPreference.mockResolvedValue(false)
  getPkgToolStatus.mockResolvedValue({
    status: 'resolved',
    detected: 'pnpm',
    tool: 'pnpm',
    source: 'saved-preference',
    candidates: [{ tool: 'pnpm', indicators: ['pnpm-lock.yaml'], root: '/tmp/demo' }],
  })
  getSupportedPkgToolNames.mockReturnValue(['pnpm', 'yarn', 'bun', 'npm'])
  hasPkg.mockResolvedValue(true)
  isGo.mockResolvedValue(false)
  isRust.mockResolvedValue(false)
  process.env.PI_TEST = 'true'
})

afterEach(() => {
  process.argv = originalArgv
  delete process.env.PI_TEST
  delete process.env.PI_FORCE_PICK_TOOL
  delete process.env.PI_FORGET_PICK_TOOL
  delete process.env.PI_PREFERRED_TOOL
  vi.clearAllMocks()
})

describe('setup command guard', () => {
  it('does not run deps for pbuild in node projects', async () => {
    process.argv = ['node', binPath('pbuild'), 'arg1']
    const { setup } = await import('../src/index')
    await expect(setup()).resolves.toBeUndefined()
    expect(installDeps).not.toHaveBeenCalled()
  })

  it('does not run deps for unknown commands', async () => {
    process.argv = ['node', binPath('punknown'), 'arg1']
    const { setup } = await import('../src/index')
    await expect(setup()).resolves.toBeUndefined()
    expect(installDeps).not.toHaveBeenCalled()
  })

  it('shows the current package-manager status without running installs', async () => {
    process.argv = ['node', binPath('pi'), '--show-tool']
    const { setup } = await import('../src/index')
    await expect(setup()).resolves.toBeUndefined()
    expect(getPkgToolStatus).toHaveBeenCalledTimes(1)
    expect(printPkgToolStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'resolved',
        tool: 'pnpm',
      }),
      { json: false },
    )
    expect(resolvePkgTool).not.toHaveBeenCalled()
  })

  it('shows the current package-manager status as json', async () => {
    process.argv = ['node', binPath('pi'), '--show-tool', '--json']
    const { setup } = await import('../src/index')
    await expect(setup()).resolves.toBeUndefined()
    expect(getPkgToolStatus).toHaveBeenCalledTimes(1)
    expect(printPkgToolStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'resolved',
        tool: 'pnpm',
      }),
      { json: true },
    )
    expect(resolvePkgTool).not.toHaveBeenCalled()
  })

  it('passes an explicit tool choice through to package-manager resolution', async () => {
    process.argv = ['node', binPath('pi'), '--choose-tool', 'bun']
    const { setup } = await import('../src/index')
    await expect(setup()).resolves.toBeUndefined()
    expect(process.env.PI_PREFERRED_TOOL).toBe('bun')
    expect(resolvePkgTool).toHaveBeenCalledTimes(1)
  })

  it('lists candidate tools without running installs', async () => {
    process.argv = ['node', binPath('pi'), '--list-tools', '--json']
    const { setup } = await import('../src/index')
    await expect(setup()).resolves.toBeUndefined()
    expect(getPkgToolStatus).toHaveBeenCalledTimes(1)
    expect(printPkgToolCandidates).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'resolved',
        tool: 'pnpm',
      }),
      { json: true },
    )
    expect(printPkgToolStatus).not.toHaveBeenCalled()
    expect(resolvePkgTool).not.toHaveBeenCalled()
  })

  it('passes arguments through to external pa alias', async () => {
    process.argv = ['node', binPath('pa'), 'run', '--fast']
    const { setup } = await import('../src/index')
    await expect(setup()).resolves.toBeUndefined()
    expect(jsShell).toHaveBeenCalledWith('na run --fast', 'inherit')
  })

  it('passes arguments through to external pu alias', async () => {
    process.argv = ['node', binPath('pu'), '--latest']
    const { setup } = await import('../src/index')
    await expect(setup()).resolves.toBeUndefined()
    expect(jsShell).toHaveBeenCalledWith('nu --latest', 'inherit')
  })
})
