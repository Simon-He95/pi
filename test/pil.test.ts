import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPkg = vi.fn()
const pi = vi.fn()
const getParams = vi.fn()
const isInteractive = vi.fn()
const ttyMultiSelect = vi.fn()

vi.mock('lazy-js-utils/node', () => ({
  getPkg,
}))

vi.mock('../src/pi', () => ({
  pi,
}))

vi.mock('../src/utils', () => ({
  getParams,
}))

vi.mock('../src/tty', () => ({
  isInteractive,
  ttyMultiSelect,
}))

beforeEach(() => {
  vi.resetModules()
  getPkg.mockResolvedValue({
    dependencies: {
      'markstream-vue': '1.0.1',
      'stream-monaco': '^0.0.44',
    },
    devDependencies: {},
  })
  getParams.mockImplementation(async params => params)
  pi.mockResolvedValue(undefined)
  isInteractive.mockReturnValue(false)
  ttyMultiSelect.mockResolvedValue([])
})

describe('pil', () => {
  it('installs explicit packages at latest and records the pil shortcut', async () => {
    const { pil } = await import('../src/pil')

    await pil('markstream-vue stream-monaco')

    expect(pi).toHaveBeenCalledWith(
      ['markstream-vue@latest stream-monaco@latest'],
      'markstream-vue$1.0.1 stream-monaco$^0.0.44',
      'pil',
      'pil markstream-vue stream-monaco',
    )
  })
})
