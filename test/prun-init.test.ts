import { afterEach, describe, expect, it, vi } from 'vitest'
import { printPrunInit } from '../src/prun'

afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.PRUN_BIN
})

describe('printPrunInit', () => {
  it('emits history sync hooks for bash', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    printPrunInit(['bash'])

    const script = logSpy.mock.calls[0]?.[0]
    expect(script).toContain('__prun_sync_history()')
    expect(script).toContain('PROMPT_COMMAND="__prun_sync_history')
    expect(script).toContain('history -s -- "$hint_cmd"')
  })

  it('emits a PowerShell prompt hook that re-adds the selected command to PSReadLine history', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    printPrunInit(['powershell'])

    const script = logSpy.mock.calls[0]?.[0]
    expect(script).toContain('function global:prun')
    expect(script).toContain('function global:__prun_sync_history')
    expect(script).toContain('PSConsoleReadLine')
    expect(script).toContain('AddToHistory($hintCmd)')
    expect(script).toContain('function global:prompt')
  })

  it('keeps multi-part PowerShell debug bins invokable', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    printPrunInit(['pwsh', 'node ./prun.mjs'])

    const script = logSpy.mock.calls[0]?.[0]
    expect(script).toContain("$script:__prun_bin = @('node', './prun.mjs')")
  })
})
