import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { ccommand } = vi.hoisted(() => ({
  ccommand: vi.fn(),
}))

vi.mock('../src/require', () => ({
  getCcommand: () => ({ ccommand }),
}))

const trackedEnv = [
  'CCOMMAND_NO_HISTORY',
  'NO_HISTORY',
  'PI_AUTO_INIT',
  'PRUN_AUTO_INIT',
  'PI_NO_AUTO_INIT',
  'PRUN_NO_AUTO_INIT',
] as const

const originalEnv = Object.fromEntries(
  trackedEnv.map(name => [name, process.env[name]]),
) as Record<typeof trackedEnv[number], string | undefined>

function restoreEnv() {
  for (const name of trackedEnv) {
    const value = originalEnv[name]
    if (value == null)
      delete process.env[name]
    else
      process.env[name] = value
  }
}

beforeEach(() => {
  vi.resetModules()
  restoreEnv()
  ccommand.mockReset()
  ccommand.mockResolvedValue(undefined)
})

afterEach(() => {
  restoreEnv()
  vi.restoreAllMocks()
})

describe('history disable env precedence', () => {
  it('lets NO_HISTORY disable prun history even when CCOMMAND_NO_HISTORY is false-like', async () => {
    let seenNoHistory: string | undefined

    ccommand.mockImplementation(async () => {
      seenNoHistory = process.env.CCOMMAND_NO_HISTORY
    })

    process.env.CCOMMAND_NO_HISTORY = '0'
    process.env.NO_HISTORY = '1'
    process.env.PRUN_NO_AUTO_INIT = '1'

    const { prun } = await import('../src/prun')
    await prun('dev')

    expect(ccommand).toHaveBeenCalledWith('dev')
    expect(seenNoHistory).toBe('1')
    expect(process.env.CCOMMAND_NO_HISTORY).toBe('0')
  })

  it('lets NO_HISTORY disable pfind history even when CCOMMAND_NO_HISTORY is false-like', async () => {
    let seenNoHistory: string | undefined

    ccommand.mockImplementation(async () => {
      seenNoHistory = process.env.CCOMMAND_NO_HISTORY
    })

    process.env.CCOMMAND_NO_HISTORY = '0'
    process.env.NO_HISTORY = '1'
    process.env.PRUN_NO_AUTO_INIT = '1'

    const { pfind } = await import('../src/pfind')
    await pfind('build')

    expect(ccommand).toHaveBeenCalledWith('find build')
    expect(seenNoHistory).toBe('1')
    expect(process.env.CCOMMAND_NO_HISTORY).toBe('0')
  })
})
