import { beforeEach, describe, expect, it, vi } from 'vitest'

const ensurePrunAutoInit = vi.fn()
const ccommand = vi.fn()

vi.mock('../src/prun', () => ({
  ensurePrunAutoInit,
}))

vi.mock('../src/require', () => ({
  getCcommand: () => ({ ccommand }),
}))

describe('pfind', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ccommand.mockResolvedValue(undefined)
    delete process.env.CCOMMAND_NO_HISTORY
    delete process.env.NO_HISTORY
  })

  it('ensures shell auto init before delegating to ccommand', async () => {
    const { pfind } = await import('../src/pfind')

    await pfind('api')

    expect(ensurePrunAutoInit).toHaveBeenCalledTimes(1)
    expect(ccommand).toHaveBeenCalledWith('find api')
  })
})
