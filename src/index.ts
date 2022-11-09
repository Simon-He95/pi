// bin
import { Worker } from 'worker_threads'
import { jsShell } from 'simon-js-tool'
import type { Color, Spinner } from 'ora'
import ora from 'ora'

// package install
export async function pi() {
  const { status: hasNi } = jsShell('ni -v', 'pipe')
  if (hasNi === 1)
    await jsShell('npm i -g @antfu/ni', 'pipe')
  const { result: _color = 'yellow' } = await jsShell('echo $PI_COLOR', 'pipe')
  const color = _color as Color
  const { result: _spinner = 'star' } = await jsShell('echo $PI_SPINNER', 'pipe')
  const spinner = _spinner as unknown as Spinner
  const argv = process.argv.slice(2)
  const params = argv.join(' ')
  const pkg = argv.filter(v => !v.startsWith('-')).join(' ')
  const text = pkg ? `Installing ${pkg} ...\n` : '正在更新依赖...\n'
  const successMsg = pkg ? `Installed ${pkg} successfully! 😊` : '更新依赖成功! 😊'
  const failMsg = pkg ? `Failed to install ${pkg} 😭` : '更新依赖失败! 😭'

  const loading = ora({
    text,
    spinner,
    color,
  }).start()

  const status = await runWorker(params)
  if (status === 0)
    loading.succeed(successMsg)
  else
    loading.fail(failMsg)
  process.exit()
}

pi()

function runWorker(params: string) {
  return new Promise((resolve) => {
    const seprateThread = new Worker('./src/seprateThread.js')
    seprateThread.on('message', resolve)
    seprateThread.postMessage(params)
  })
}
