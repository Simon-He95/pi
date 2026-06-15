import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getPkg = vi.fn()
const useNodeWorker = vi.fn()
const jsShell = vi.fn()
const detectNode = vi.fn()
const getLatestVersion = vi.fn()
const getParams = vi.fn()
const loading = vi.fn()

vi.mock('lazy-js-utils/node', () => ({
  getPkg,
  jsShell,
  useNodeWorker,
}))

vi.mock('../src/detectNode', () => ({
  detectNode,
}))

vi.mock('../src/pkgManager', () => ({
  getInstallCommand: (tool: string, hasParams: boolean) =>
    tool === 'pnpm' ? `pnpm ${hasParams ? 'add' : 'install'}` : 'npm install',
  resolvePkgTool: async () => ({
    detected: 'pnpm',
    tool: 'pnpm',
  }),
}))

vi.mock('../src/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/utils')>()
  return {
    ...actual,
    getLatestVersion,
    getParams,
    loading,
  }
})

const originalEnv = {
  CCOMMAND_HISTORY_HINT: process.env.CCOMMAND_HISTORY_HINT,
  HISTFILE: process.env.HISTFILE,
  HISTTIMEFORMAT: process.env.HISTTIMEFORMAT,
  HOME: process.env.HOME,
  PI_DEFAULT: process.env.PI_DEFAULT,
  PI_SILENT: process.env.PI_SILENT,
  SHELL: process.env.SHELL,
  XDG_CACHE_HOME: process.env.XDG_CACHE_HOME,
}
const tempDirs: string[] = []

function setEnv(name: string, value?: string) {
  if (value == null)
    delete process.env[name]
  else
    process.env[name] = value
}

function restoreEnv() {
  for (const [name, value] of Object.entries(originalEnv))
    setEnv(name, value)
}

beforeEach(() => {
  vi.resetModules()
  getPkg.mockResolvedValue({
    dependencies: {
      'markstream-vue': '1.0.1',
      'stream-monaco': '^0.0.44',
    },
    devDependencies: {},
  })
  getLatestVersion.mockResolvedValue('ok')
  getParams.mockImplementation(async params => params)
  loading.mockResolvedValue({ succeed: vi.fn(), fail: vi.fn() })
  useNodeWorker.mockResolvedValue({ status: 0, result: '' })
  jsShell.mockReset()
  detectNode.mockResolvedValue(undefined)

  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-pil-history-'))
  tempDirs.push(home)
  const historyFile = path.join(home, 'bash-history')
  fs.writeFileSync(historyFile, '', 'utf8')
  process.env.CCOMMAND_HISTORY_HINT = path.join(home, 'hint', 'last-history')
  process.env.HISTFILE = historyFile
  process.env.HOME = home
  process.env.SHELL = '/bin/bash'
  delete process.env.HISTTIMEFORMAT
  delete process.env.PI_DEFAULT
  delete process.env.PI_SILENT
  delete process.env.XDG_CACHE_HOME
})

afterEach(() => {
  vi.restoreAllMocks()
  restoreEnv()
  tempDirs.splice(0).forEach(dir => fs.rmSync(dir, { force: true, recursive: true }))
})

describe('pil history', () => {
  it('writes the pil shortcut to the history hint, not the expanded install command', async () => {
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never)
    vi.spyOn(console, 'log').mockImplementation(() => {})

    const { pil } = await import('../src/pil')
    await pil('markstream-vue stream-monaco')

    expect(useNodeWorker).toHaveBeenCalledWith({
      params: 'pnpm add markstream-vue@latest stream-monaco@latest',
      stdio: ['inherit', 'pipe', 'inherit'],
      errorExit: false,
    })
    expect(fs.readFileSync(process.env.CCOMMAND_HISTORY_HINT!, 'utf8')).toMatch(
      /^\d+\tpil markstream-vue stream-monaco\n$/,
    )
    expect(fs.readFileSync(process.env.HISTFILE!, 'utf8')).toBe(
      'pil markstream-vue stream-monaco\n',
    )

    exitSpy.mockRestore()
  })
})
