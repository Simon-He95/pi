import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const useNodeWorker = vi.fn()
const jsShell = vi.fn()
const getPkgTool = vi.fn()
const detectNode = vi.fn()
const getLatestVersion = vi.fn()
const getParams = vi.fn()
const loading = vi.fn()
const pushHistory = vi.fn()

vi.mock('lazy-js-utils/node', () => ({
  getPkgTool,
  jsShell,
  useNodeWorker,
}))

vi.mock('../src/detectNode', () => ({
  detectNode,
}))

vi.mock('../src/utils', () => ({
  getLatestVersion,
  getParams,
  loading,
  pushHistory,
}))

describe('pi latest installs', () => {
  let loadingStatus: { succeed: ReturnType<typeof vi.fn>, fail: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.resetModules()
    loadingStatus = { succeed: vi.fn(), fail: vi.fn() }
    loading.mockImplementation(async () => loadingStatus)
    getLatestVersion.mockResolvedValue('ok')
    getPkgTool.mockResolvedValue('pnpm')
    useNodeWorker.mockReset()
    jsShell.mockReset()
    detectNode.mockResolvedValue(undefined)
    delete process.env.PI_DEFAULT
    delete process.env.PI_SILENT
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('waits for all parallel installs before succeeding', async () => {
    const resolvers: Array<(value: { status: number, result: string }) => void> = []
    useNodeWorker.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve)
        }),
    )

    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never)

    const { pi } = await import('../src/pi')
    const promise = pi(
      ['foo@latest -S', 'bar@latest -D'],
      'foo$1.0.0 bar$2.0.0',
      'pil',
    )

    await new Promise(resolve => setImmediate(resolve))
    expect(useNodeWorker).toHaveBeenCalledTimes(2)
    expect(loadingStatus.succeed).not.toHaveBeenCalled()

    resolvers[0]({ status: 0, result: '' })
    await Promise.resolve()
    expect(loadingStatus.succeed).not.toHaveBeenCalled()

    resolvers[1]({ status: 0, result: '' })
    await promise

    expect(loadingStatus.succeed).toHaveBeenCalledTimes(1)

    const commands = useNodeWorker.mock.calls.map(call => call[0]?.params)
    expect(commands).toContain('pnpm add foo@latest -S')
    expect(commands).toContain('pnpm add bar@latest -D')

    exitSpy.mockRestore()
  })
})
