import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const originalEnv = {
  CCOMMAND_HISTORY_HINT: process.env.CCOMMAND_HISTORY_HINT,
  HISTFILE: process.env.HISTFILE,
  HOME: process.env.HOME,
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

afterEach(() => {
  vi.restoreAllMocks()
  restoreEnv()
  tempDirs.splice(0).forEach(dir => fs.rmSync(dir, { force: true, recursive: true }))
})

describe('pushHistory history hint', () => {
  it('writes the shell hook history hint even when the shell history file is missing', async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-history-hint-'))
    tempDirs.push(home)
    const hintPath = path.join(home, 'hint', 'last-history')
    process.env.CCOMMAND_HISTORY_HINT = hintPath
    process.env.HISTFILE = path.join(home, 'missing-bash-history')
    process.env.HOME = home
    process.env.SHELL = '/bin/bash'
    delete process.env.XDG_CACHE_HOME
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.resetModules()

    const { pushHistory } = await import('../src/utils')
    await pushHistory('pnpm add foo')

    expect(fs.readFileSync(hintPath, 'utf8')).toMatch(/^\d+\tpnpm add foo\n$/)
  })
})
