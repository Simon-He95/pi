import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const jsShell = vi.fn()
const spawnSync = vi.fn()

vi.mock('lazy-js-utils/node', () => ({
  jsShell,
}))

vi.mock('node:child_process', () => ({
  spawnSync,
}))

beforeEach(() => {
  vi.resetModules()
  jsShell.mockReset()
  spawnSync.mockReset()
  process.exitCode = undefined
})

afterEach(() => {
  process.exitCode = undefined
  vi.restoreAllMocks()
})

describe('legacy aliases', () => {
  it('pa reports a clear error when na is missing', async () => {
    spawnSync.mockReturnValue({ status: 1 })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { pa } = await import('../src/pa')

    pa('react')

    expect(process.exitCode).toBe(1)
    expect(jsShell).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith(expect.stringContaining('`na` is not installed'))
  })

  it('pu reports a clear error when nu is missing', async () => {
    spawnSync.mockReturnValue({ status: 1 })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { pu } = await import('../src/pu')

    pu('react')

    expect(process.exitCode).toBe(1)
    expect(jsShell).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith(expect.stringContaining('`nu` is not installed'))
  })
})
