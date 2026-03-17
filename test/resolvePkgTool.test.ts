import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let pkgTool: 'pnpm' | 'yarn' | 'npm' | 'bun' = 'npm'
let interactive = false
const ttySelect = vi.fn()

vi.mock('lazy-js-utils/node', () => ({
  getPkgTool: async () => pkgTool,
}))

vi.mock('../src/tty', () => ({
  isInteractive: () => interactive,
  ttySelect,
}))

const originalCwd = process.cwd()
const originalConfigHome = process.env.XDG_CONFIG_HOME

async function createTempWorkspace() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pi-resolve-tool-'))
  return dir
}

async function importResolvePkgTool() {
  const mod = await import('../src/pkgManager')
  return mod.resolvePkgTool
}

async function importGetPkgToolStatus() {
  const mod = await import('../src/pkgManager')
  return mod.getPkgToolStatus
}

beforeEach(() => {
  vi.resetModules()
  pkgTool = 'npm'
  interactive = false
  ttySelect.mockReset()
  delete process.env.PI_DEFAULT
})

afterEach(() => {
  process.chdir(originalCwd)
  if (originalConfigHome == null)
    delete process.env.XDG_CONFIG_HOME
  else
    process.env.XDG_CONFIG_HOME = originalConfigHome
})

describe('resolvePkgTool', () => {
  it('infers pnpm in a pnpm workspace even if detected npm', async () => {
    const dir = await createTempWorkspace()
    await fs.writeFile(path.join(dir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n', 'utf8')
    process.chdir(dir)
    process.env.XDG_CONFIG_HOME = path.join(dir, '.config')

    const resolvePkgTool = await importResolvePkgTool()
    const res = await resolvePkgTool()

    expect(res.detected).toBe('pnpm')
    expect(res.tool).toBe('pnpm')
  })

  it('prompts once and remembers the selected tool for a mixed workspace', async () => {
    const dir = await createTempWorkspace()
    await fs.writeFile(path.join(dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n', 'utf8')
    await fs.writeFile(path.join(dir, 'bun.lock'), '', 'utf8')
    process.chdir(dir)
    process.env.XDG_CONFIG_HOME = path.join(dir, '.config')

    interactive = true
    ttySelect.mockImplementation(async (options: string[]) =>
      options.find(option => option.startsWith('bun:')) || options[0],
    )

    const resolvePkgTool = await importResolvePkgTool()
    const first = await resolvePkgTool()

    expect(first.tool).toBe('bun')
    expect(ttySelect).toHaveBeenCalledTimes(1)

    vi.resetModules()
    interactive = false

    const resolvePkgToolAgain = await importResolvePkgTool()
    const second = await resolvePkgToolAgain()

    expect(second.tool).toBe('bun')
    expect(ttySelect).toHaveBeenCalledTimes(1)
  })

  it('forceChoose overwrites the remembered tool', async () => {
    const dir = await createTempWorkspace()
    await fs.writeFile(path.join(dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n', 'utf8')
    await fs.writeFile(path.join(dir, 'bun.lock'), '', 'utf8')
    process.chdir(dir)
    process.env.XDG_CONFIG_HOME = path.join(dir, '.config')

    interactive = true
    ttySelect.mockImplementationOnce(async (options: string[]) =>
      options.find(option => option.startsWith('bun:')) || options[0],
    )

    let resolvePkgTool = await importResolvePkgTool()
    expect((await resolvePkgTool()).tool).toBe('bun')

    vi.resetModules()
    interactive = true
    ttySelect.mockReset()
    ttySelect.mockImplementationOnce(async (options: string[]) =>
      options.find(option => option.startsWith('pnpm:')) || options[0],
    )

    resolvePkgTool = await importResolvePkgTool()
    expect((await resolvePkgTool({ forceChoose: true })).tool).toBe('pnpm')

    vi.resetModules()
    interactive = false
    resolvePkgTool = await importResolvePkgTool()
    expect((await resolvePkgTool()).tool).toBe('pnpm')
  })

  it('forgetPreference removes the saved workspace choice', async () => {
    const dir = await createTempWorkspace()
    await fs.writeFile(path.join(dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n', 'utf8')
    await fs.writeFile(path.join(dir, 'bun.lock'), '', 'utf8')
    process.chdir(dir)
    process.env.XDG_CONFIG_HOME = path.join(dir, '.config')

    interactive = true
    ttySelect.mockImplementationOnce(async (options: string[]) =>
      options.find(option => option.startsWith('bun:')) || options[0],
    )

    let resolvePkgTool = await importResolvePkgTool()
    await resolvePkgTool()

    const configPath = path.join(dir, '.config', 'pi', 'workspace-tools.json')
    const before = JSON.parse(await fs.readFile(configPath, 'utf8')) as { workspaces: Record<string, string> }
    expect(Object.values(before.workspaces)).toContain('bun')

    vi.resetModules()
    interactive = false
    resolvePkgTool = await importResolvePkgTool()
    await resolvePkgTool({ forgetPreference: true })

    const after = JSON.parse(await fs.readFile(configPath, 'utf8')) as { workspaces: Record<string, string> }
    expect(Object.values(after.workspaces)).not.toContain('bun')
  })

  it('cleans up stale remembered tools when the lockfile disappears', async () => {
    const dir = await createTempWorkspace()
    await fs.writeFile(path.join(dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n', 'utf8')
    await fs.writeFile(path.join(dir, 'bun.lock'), '', 'utf8')
    process.chdir(dir)
    process.env.XDG_CONFIG_HOME = path.join(dir, '.config')

    interactive = true
    ttySelect.mockImplementationOnce(async (options: string[]) =>
      options.find(option => option.startsWith('bun:')) || options[0],
    )

    let resolvePkgTool = await importResolvePkgTool()
    await resolvePkgTool()

    await fs.unlink(path.join(dir, 'bun.lock'))

    vi.resetModules()
    interactive = false
    resolvePkgTool = await importResolvePkgTool()

    const result = await resolvePkgTool()
    expect(result.tool).toBe('pnpm')

    const configPath = path.join(dir, '.config', 'pi', 'workspace-tools.json')
    const after = JSON.parse(await fs.readFile(configPath, 'utf8')) as { workspaces: Record<string, string> }
    expect(Object.values(after.workspaces)).not.toContain('bun')
  })

  it('reports saved-preference as the source when a workspace choice exists', async () => {
    const dir = await createTempWorkspace()
    await fs.writeFile(path.join(dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n', 'utf8')
    await fs.writeFile(path.join(dir, 'bun.lock'), '', 'utf8')
    process.chdir(dir)
    process.env.XDG_CONFIG_HOME = path.join(dir, '.config')

    interactive = true
    ttySelect.mockImplementationOnce(async (options: string[]) =>
      options.find(option => option.startsWith('bun:')) || options[0],
    )

    let resolvePkgTool = await importResolvePkgTool()
    await resolvePkgTool()

    vi.resetModules()
    interactive = false
    const getPkgToolStatus = await importGetPkgToolStatus()
    const status = await getPkgToolStatus()

    expect(status).toMatchObject({
      status: 'resolved',
      tool: 'bun',
      source: 'saved-preference',
    })
  })

  it('reports needs-selection when multiple tools exist without a saved choice', async () => {
    const dir = await createTempWorkspace()
    await fs.writeFile(path.join(dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n', 'utf8')
    await fs.writeFile(path.join(dir, 'bun.lock'), '', 'utf8')
    process.chdir(dir)
    process.env.XDG_CONFIG_HOME = path.join(dir, '.config')

    interactive = true

    const getPkgToolStatus = await importGetPkgToolStatus()
    const status = await getPkgToolStatus()

    expect(status).toMatchObject({
      status: 'needs-selection',
      detected: 'npm',
    })
    expect(status.candidates.map(candidate => candidate.tool)).toEqual(['pnpm', 'bun'])
  })

  it('accepts a direct preferred tool without opening the picker', async () => {
    const dir = await createTempWorkspace()
    await fs.writeFile(path.join(dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n', 'utf8')
    await fs.writeFile(path.join(dir, 'bun.lock'), '', 'utf8')
    process.chdir(dir)
    process.env.XDG_CONFIG_HOME = path.join(dir, '.config')

    interactive = false

    const resolvePkgTool = await importResolvePkgTool()
    const result = await resolvePkgTool({ preferredTool: 'bun' })

    expect(result).toMatchObject({
      tool: 'bun',
      source: 'fresh-selection',
    })
    expect(ttySelect).not.toHaveBeenCalled()

    vi.resetModules()
    const getPkgToolStatus = await importGetPkgToolStatus()
    const status = await getPkgToolStatus()
    expect(status).toMatchObject({
      status: 'resolved',
      tool: 'bun',
      source: 'saved-preference',
    })
  })
})
