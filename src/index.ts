import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'
import { jsShell, useNodeWorker, getPkgTool } from 'simon-js-tool'
import type { Color, Spinner } from 'ora'
import ora from 'ora'
import { version } from '../package.json'

interface IJsShell {
  status: 0 | 1
  result: string
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const url = path.resolve(__dirname, './seprateThread.mjs')

// package install
export async function pi(params: string[], pkg: string) {
  const text = pkg ? `Installing ${pkg} ...\n` : '正在更新依赖...\n'
  const successMsg = pkg ? `Installed ${pkg} successfully! 😊` : '更新依赖成功! 😊'
  const failMsg = pkg ? `Failed to install ${pkg} , v我50 😭` : '更新依赖失败! 😭'

  const { succeed, fail } = await loading(text)

  const { status } = await useNodeWorker(url, { params, operate: 'install' }) as IJsShell
  if (status === 0)
    succeed(successMsg)
  else
    fail(failMsg)
  process.exit()
}

// package uninstall
export async function pui(params: string[], pkg: string) {
  const text = `Uninstalling ${pkg} ...\n`
  const successMsg = `unInstalled ${pkg} successfully! 😊`
  const failMsg = `Failed to uninstall ${pkg} 😭`
  if (!pkg) {
    console.log('请输入要卸载的包名')
    process.exit(1)
  }
  const { succeed, fail } = await loading(text)

  const { status } = await useNodeWorker(url, { params, operate: 'uninstall' }) as IJsShell
  if (status === 0)
    succeed(successMsg)
  else
    fail(failMsg)
  process.exit()
}

// package run script
export function prun(params: string[], pkg?: string) {
  jsShell(`ccommand ${params}`)
}

export function pinit(params: string[], pkg?: string) {
  console.log('正在初始化项目...')
  switch (getPkgTool()) {
    case 'npm':
      jsShell('npm init -y')
      return
    case 'yarn':
      jsShell('yarn init -y')
      return
    case 'pnpm':
      jsShell('pnpm init -y')
      return
    default:
      jsShell('npm init -y')
  }
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
  const { status: hasCcommand } = jsShell('ccommand -v', 'pipe')
  if (hasCcommand === 1)
    await jsShell('npm i -g ccommand', 'pipe')
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
    \'PI Commands:\' \'pi: install package\' \'pui: uninstall package\' \'prun: run package script\' \'pinit: package init\' \'pbuild: go build | cargo build\'')
    process.exit(0)
  }
}
const runMap: Record<string, Function> = {
  pi,
  pui,
  prun,
  pinit
}

function isGo() {
  const { result } = jsShell('test -f "go.mod" && echo "0"|| echo "1"', 'pipe')
  return result === '0'
}

function isRust() {
  const { result } = jsShell('test -f "Cargo.toml" && echo "0"|| echo "1"', 'pipe')
  return result === '0'
}

async function loading(text: string) {
  const { color, spinner } = await getStyle()

  return ora({
    text,
    spinner,
    color,
  }).start()
}

export async function runner() {
  const cmd = process.argv[1]
  const last = cmd.lastIndexOf('/') + 1
  const exec = cmd.slice(last, cmd.length)
  const argv = process.argv.slice(2)
  returnVersion(argv)
  const params = argv.join(' ')

  if (isGo()) {
    if (exec === 'pi') {
      loading(`Installing ${params} ...\n`)
      jsShell(`go get ${params}`)
      return
    }
    else if (exec === 'pui') {
      loading(`Uninstalling ${params} ...\n`)
      jsShell(`go clean ${params}`)
      return
    }
    else if (exec === 'prun') {
      jsShell(`go run ${params}`)
      return
    } else if (exec === 'pinit') {
      jsShell(`go mod init ${params}`)
      return
    } else if (exec === 'pbuild') {
      jsShell(`go build ${params}`)
      return
    }
    console.log('go mod 项目暂不支持其他命令')
    return
  }
  if (isRust()) {
    if (exec === 'pi') {
      loading(`Installing ${params} ...\n`)
      jsShell(`cargo install ${params}`)
      return
    }
    else if (exec === 'pui') {
      loading(`Uninstalling ${params} ...\n`)
      jsShell(`cargo uninstall ${params}`)
      return
    }
    else if (exec === 'prun') {
      jsShell(`cargo run ${params}`)
      return
    } else if (exec === 'pinit') {
      jsShell(`cargo init ${params}`)
      return
    } else if (exec === 'pbuild') {
      jsShell(`cargo build ${params}`)
      return
    }
    console.log('Cargo 项目暂不支持其他命令')
    return
  }
  if (!runMap[exec]) {
    console.log('命令不存在,请执行pi -h查看帮助')
    return
  }
  const pkg = argv.filter(v => !v.startsWith('-')).join(' ')
  await installDeps()

  runMap[exec](params, pkg)
}

runner()
