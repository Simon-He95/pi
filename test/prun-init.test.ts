import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ensurePrunAutoInit, printPrunInit } from '../src/prun'

const originalStdinIsTTY = process.stdin.isTTY
const originalStdoutIsTTY = process.stdout.isTTY
const originalEnv = {
  BASH_VERSION: process.env.BASH_VERSION,
  CI: process.env.CI,
  FISH_VERSION: process.env.FISH_VERSION,
  HOME: process.env.HOME,
  PI_AUTO_INIT: process.env.PI_AUTO_INIT,
  PI_NO_AUTO_INIT: process.env.PI_NO_AUTO_INIT,
  POWERSHELL_DISTRIBUTION_CHANNEL: process.env.POWERSHELL_DISTRIBUTION_CHANNEL,
  PRUN_AUTO_INIT: process.env.PRUN_AUTO_INIT,
  PRUN_BIN: process.env.PRUN_BIN,
  PRUN_NO_AUTO_INIT: process.env.PRUN_NO_AUTO_INIT,
  SHELL: process.env.SHELL,
  ZDOTDIR: process.env.ZDOTDIR,
  ZSH_VERSION: process.env.ZSH_VERSION,
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

function setTTY(stdinValue?: boolean, stdoutValue = stdinValue) {
  Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: stdinValue })
  Object.defineProperty(process.stdout, 'isTTY', { configurable: true, value: stdoutValue })
}

function prepareAutoInitEnv() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-prun-init-'))
  tempDirs.push(home)
  process.env.HOME = home
  process.env.ZDOTDIR = home
  process.env.SHELL = '/bin/zsh'
  delete process.env.BASH_VERSION
  delete process.env.CI
  delete process.env.FISH_VERSION
  delete process.env.PI_AUTO_INIT
  delete process.env.PI_NO_AUTO_INIT
  delete process.env.POWERSHELL_DISTRIBUTION_CHANNEL
  delete process.env.PRUN_AUTO_INIT
  delete process.env.PRUN_NO_AUTO_INIT
  delete process.env.ZSH_VERSION
  setTTY(true, true)

  return path.join(home, '.zshrc')
}

afterEach(() => {
  vi.restoreAllMocks()
  restoreEnv()
  setTTY(originalStdinIsTTY, originalStdoutIsTTY)
  tempDirs.splice(0).forEach(dir => fs.rmSync(dir, { force: true, recursive: true }))
})

describe('printPrunInit', () => {
  it('emits history sync hooks for zsh', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    printPrunInit(['zsh'])

    const script = logSpy.mock.calls[0]?.[0]
    expect(script).toContain('__prun_sync_history()')
    expect(script).toContain('add-zsh-hook precmd __prun_precmd')
    expect(script).toContain('print -s -- "$hint_cmd"')
    expect(script).toContain('$last_cmd == pfind || $last_cmd == pfind\\ *')
  })

  it('emits history sync hooks for bash', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    printPrunInit(['bash'])

    const script = logSpy.mock.calls[0]?.[0]
    expect(script).toContain('__prun_sync_history()')
    expect(script).toContain('PROMPT_COMMAND="__prun_sync_history')
    expect(script).toContain('history -s -- "$hint_cmd"')
    expect(script).toContain('$last_cmd == pfind || $last_cmd == pfind\\ *')
  })

  it('emits a fish wrapper for pfind history sync', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    printPrunInit(['fish'])

    const script = logSpy.mock.calls[0]?.[0]
    expect(script).toContain('function __prun_sync_history')
    expect(script).toContain('function pfind')
    expect(script).toContain('command pfind $argv')
    expect(script).toContain('__prun_sync_history')
  })

  it('emits a PowerShell prompt hook with PSReadLine and file history fallback', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    printPrunInit(['powershell'])

    const script = logSpy.mock.calls[0]?.[0]
    expect(script).toContain('function global:prun')
    expect(script).toContain('function global:__prun_sync_history')
    expect(script).toContain('function global:__prun_add_history')
    expect(script).toContain('PSConsoleReadLine')
    expect(script).toContain('AddToHistory($Command)')
    expect(script).toContain('HistorySavePath')
    expect(script).toContain('[void](__prun_add_history $hintCmd)')
    expect(script).toContain('function global:prompt')
  })

  it('keeps multi-part PowerShell debug bins invokable', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    printPrunInit(['pwsh', 'node ./prun.mjs'])

    const script = logSpy.mock.calls[0]?.[0]
    expect(script).toContain("$script:__prun_bin = @('node', './prun.mjs')")
  })

  it('does not auto install the shell hook by default', () => {
    const rcFile = prepareAutoInitEnv()

    ensurePrunAutoInit()

    expect(fs.existsSync(rcFile)).toBe(false)
  })

  it('auto installs the shell hook when explicitly enabled', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const rcFile = prepareAutoInitEnv()
    process.env.PI_AUTO_INIT = '1'

    ensurePrunAutoInit()

    expect(fs.readFileSync(rcFile, 'utf8')).toContain('prun --init zsh')
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Installed shell hook'))
  })

  it('treats either disable flag as authoritative', () => {
    const rcFile = prepareAutoInitEnv()
    process.env.PI_AUTO_INIT = '1'
    process.env.PI_NO_AUTO_INIT = '0'
    process.env.PRUN_NO_AUTO_INIT = '1'

    ensurePrunAutoInit()

    expect(fs.existsSync(rcFile)).toBe(false)
  })

  it('accepts either auto-init flag', () => {
    const rcFile = prepareAutoInitEnv()
    process.env.PI_AUTO_INIT = '0'
    process.env.PRUN_AUTO_INIT = '1'

    ensurePrunAutoInit()

    expect(fs.readFileSync(rcFile, 'utf8')).toContain('prun --init zsh')
  })
})
