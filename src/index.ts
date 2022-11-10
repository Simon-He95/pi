import { argv } from 'process'
import path from 'path'
import { fileURLToPath } from 'url'
import { jsShell, useNodeWorker } from 'simon-js-tool'
import type { Color, Spinner } from 'ora'
import ora from 'ora'
import { version } from '../package.json'
interface IJsShell {
  status: 0 | 1
  result: string
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const url = path.resolve(__dirname, './seprateThread.js')

// package install
export async function pi() {
  const argv = process.argv.slice(2)
  await installDeps()
  returnVersion(argv)
  const { color, spinner } = await getStyle()
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

  const { status } = await useNodeWorker(url, { params, operate: 'install' }) as IJsShell
  if (status === 0)
    loading.succeed(successMsg)
  else
    loading.fail(failMsg)
  process.exit()
}

// package uninstall
export async function pui() {
  const argv = process.argv.slice(2)
  await installDeps()
  returnVersion(argv)
  const { color, spinner } = await getStyle()
  const params = argv.join(' ')
  const pkg = argv.filter(v => !v.startsWith('-')).join(' ')
  const text = `Uninstalling ${pkg} ...\n`
  const successMsg = `unInstalled ${pkg} successfully! 😊`
  const failMsg = `Failed to uninstall ${pkg} 😭`
  if (!pkg) {
    console.log('请输入要卸载的包名')
    process.exit(1)
  }
  const loading = ora({
    text,
    spinner,
    color,
  }).start()

  const { status } = await useNodeWorker(url, { params, operate: 'uninstall' }) as IJsShell
  if (status === 0)
    loading.succeed(successMsg)
  else
    loading.fail(failMsg)
  process.exit()
}

// package run script
export async function prun() {
  const argv = process.argv.slice(2)
  await installDeps()
  returnVersion(argv)
  const params = argv.join(' ')
  jsShell(`ccommand ${params}`)
}

async function getStyle() {
  const { result: _color = 'yellow' } = await jsShell('echo $PI_COLOR', 'pipe')
  const color = _color as Color
  const { result: _spinner = 'star' } = await jsShell('echo $PI_SPINNER', 'pipe')
  const spinner = _spinner as unknown as Spinner
  return { color, spinner }
}

async function installDeps() {
  const { status: hasGum } = jsShell('gum -v', 'pipe')
  if (hasGum === 1)
    await jsShell('brew install gum', 'pipe')
  const { status: hasNi } = jsShell('ni -v', 'pipe')
  if (hasNi === 1)
    await jsShell('npm i -g @antfu/ni', 'pipe')
}

function returnVersion(argv: any[]) {
  const arg = argv[0]
  if (arg === '-v' || arg === '--version') {
    jsShell(`gum style \
    --foreground 212 --border-foreground 212 --border double \
    --align center --width 50 --margin "1 2" --padding "2 4" \
    'pi version:${version}' '请为我的努力点个star🌟'`)
    process.exit(0)
  }
  else if (arg === '-h' || arg === '--help') {
    jsShell('gum style \
    --foreground 212 --border-foreground 212 --border double \
    --align center --width 50 --margin "1 2" --padding "1 1" \
    \'PI Commands:\' \'pi: install package\' \'pui: uninstall package\' \'prun: run package script\'')
    process.exit(0)
  }
}
const runMap: Record<string, Function> = {
  pi,
  pui,
  prun,
}

export function runner() {
  const cmd = argv[1]
  const last = cmd.lastIndexOf('/') + 1
  const exec = cmd.slice(last, cmd.length)
  runMap[exec]?.()
}

pi()
runner()
