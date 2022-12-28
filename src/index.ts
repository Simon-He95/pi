import path from 'path'
import process from 'process'
import { getPkgTool, jsShell, spaceFormat, useNodeWorker } from 'lazy-js-utils'
import type { Color, Spinner } from 'ora'
import ora from 'ora'
import fg from 'fast-glob'
import { version } from '../package.json'

interface IJsShell {
  status: 0 | 1
  result: string
}

const rootPath = process.cwd()

// package install
export async function pi(params: string, pkg: string, executor = 'ni') {
  const text = pkg ? `Installing ${pkg} ...\n` : 'Updating dependency ...\n'
  const successMsg = pkg
    ? `Installed ${pkg} successfully! 😊`
    : 'Updated dependency successfully! 😊'
  const failMsg = pkg
    ? `Failed to install ${pkg} 😭`
    : 'Failed to update dependency! 😭'

  const newParams = await getParams(params)
  const loading_status = await loading(text)
  const { status } = (await useNodeWorker(
    `${executor} ${newParams}`,
  )) as IJsShell
  if (status === 0)
    loading_status.succeed(successMsg)
  else loading_status.fail(failMsg)
  process.exit()
}

// package uninstall
export async function pui(params: string[], pkg: string) {
  const text = `Uninstalling ${pkg} ...\n`
  const successMsg = `\nUnInstalled ${pkg} successfully! 😊`
  const failMsg = `\nFailed to uninstall ${pkg} 😭`
  if (!pkg) {
    console.log('Need to specify an uninstall package name')
    process.exit(1)
  }
  const loading_status = await loading(text)
  const { status } = (await useNodeWorker(`nun ${params}`)) as IJsShell
  if (status === 0)
    loading_status.succeed(successMsg)
  else loading_status.fail(failMsg)
  process.exit()
}

// package run script
export function prun(params: string) {
  return jsShell(`ccommand ${params}`)
}

// workspace find script
export function pfind(params: string) {
  return jsShell(`ccommand find ${params}`)
}

export function pinit() {
  console.log('Initializing project...')
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

export function pil(params: string, pkg: string) {
  const latestPkgname = spaceFormat(params, '@latest ')
  return pi(latestPkgname, pkg ? spaceFormat(`${pkg} `, '@latest ').trim() : '')
}

export function pu() {
  return jsShell('nu')
}

export function pci(params: string, pkg: string) {
  return pi(params, pkg, 'nci')
}

export function pa() {
  return jsShell('na')
}

async function getStyle() {
  const { result: _color = 'yellow' } = await jsShell('echo $PI_COLOR', 'pipe')
  const color = _color as Color
  const { result: _spinner = 'star' } = await jsShell(
    'echo $PI_SPINNER',
    'pipe',
  )
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
    'pi version:${version}' 'Please give me a 🌟 for my efforts'`)
    process.exit(0)
  }
  else if (arg === '-h' || arg === '--help') {
    jsShell(
      'gum style \
    --foreground 212 --border-foreground 212 --border double \
    --align left --width 50 --margin "1 2" --padding "1 1" \
    \'PI Commands:\'\
    \'~ pi: install package\'\
    \'~ pui: uninstall package\'\
    \'~ prun: run package script\'\
    \'~ pinit: package init\'\
    \'~ pbuild: go build | cargo build\' \
    \'~ pfind: find monorepo of yarn or pnpm\'\
    \'~ pa: agent alias\'\
    \'~ pu: package upgrade\'\
    \'~ pci: package clean install\'\
    \'~ pil: package latest install\'',
    )
    process.exit(0)
  }
}

const runMap: Record<string, Function> = {
  pi,
  pa,
  pui,
  pu,
  pil,
  pci,
  prun,
  pinit,
  pfind,
}

function isGo() {
  const url = path.resolve(rootPath, 'go.mod')
  const { result } = jsShell(
    `(test -f "main.go" || test -f "${url}") && echo "0"|| echo "1"`,
    'pipe',
  )
  return result === '0'
}

function isRust() {
  const url = path.resolve(rootPath, 'Cargo.toml')
  const { result } = jsShell(`test -f "${url}" && echo "0"|| echo "1"`, 'pipe')
  return result === '0'
}

async function loading(text: string) {
  const { color, spinner } = await getStyle()
  const result = ora({
    text,
    spinner,
    color,
  }).start()
  return result
}

function hasPkg() {
  const url = path.resolve(rootPath, 'package.json')
  const { result } = jsShell(`test -f "${url}" && echo "0"|| echo "1"`, 'pipe')
  return result === '0'
}

async function getParams(params: string) {
  const DW = /-DW/
  const W = /-W/
  const Dw = /-Dw/
  const w = /-w/
  switch (getPkgTool()) {
    case 'pnpm':
      if (DW.test(params))
        params = params.replace(DW, '-Dw')
      else if (W.test(params))
        params = params.replace(W, '-w')

      return params
    case 'yarn':
      if (Dw.test(params))
        params = params.replace(Dw, '-DW')
      else if (W.test(params))
        params = params.replace(w, '-W')

      return params
    default:
      return params
  }
}

export async function runner() {
  const cmd = process.argv[1]
  const last = cmd.lastIndexOf('/') + 1
  const exec = cmd.slice(last, cmd.length)
  const argv: string[] = process.argv.slice(2)
  returnVersion(argv)
  const params = spaceFormat(argv.join(' ')).trim()
  if (!hasPkg()) {
    if (isGo()) {
      if (exec === 'pi') {
        const loading_status = await loading(`Installing ${params} ...\n`)
        const { status } = (await useNodeWorker(`go get ${params}`)) as IJsShell
        if (status === 0)
          loading_status.succeed('Installed successfully! 😊')
        else loading_status.fail('Failed to install 😭')
      }
      else if (exec === 'pui') {
        const loading_status = await loading(`Uninstalling ${params} ...\n`)
        const { status } = (await useNodeWorker(
          `go clean ${params}`,
        )) as IJsShell
        if (status === 0)
          loading_status.succeed('Uninstalled successfully! 😊')
        else loading_status.fail('Failed to uninstall 😭')
      }
      else if (exec === 'prun') {
        const match = params
          ? params.endsWith('.go')
            ? [`**/${params}`]
            : [`**/${params}.go`, `**/${params}/main.go`]
          : 'main.go'
        const target = (await fg(match))[0]
        if (!target) {
          console.log('No such file')
          process.exit(1)
        }
        jsShell(`go run ${target}`)
      }
      else if (exec === 'pinit') {
        jsShell(`go mod init ${params}`)
      }
      else if (exec === 'pbuild') {
        jsShell(`go build ${params}`)
      }
      else {
        console.log('The commands is not supported')
      }
      process.exit()
    }
    if (isRust()) {
      if (exec === 'pi') {
        const loading_status = await loading(`Installing ${params} ...\n`)
        const { status } = (await useNodeWorker(
          `cargo install ${params}`,
        )) as IJsShell
        if (status === 0)
          loading_status.succeed('Installed successfully! 😊')
        else loading_status.fail('Failed to install 😭')
      }
      else if (exec === 'pui') {
        const loading_status = await loading(`Uninstalling ${params} ...\n`)
        const { status } = (await useNodeWorker(
          `cargo uninstall ${params}`,
        )) as IJsShell
        if (status === 0)
          loading_status.succeed('Uninstalled successfully! 😊')
        else loading_status.fail('Failed to uninstall 😭')
      }
      else if (exec === 'prun') {
        jsShell(`cargo run ${params}`)
      }
      else if (exec === 'pinit') {
        jsShell(`cargo init ${params}`)
      }
      else if (exec === 'pbuild') {
        jsShell(`cargo build ${params}`)
      }
      else {
        console.log('The commands is not supported')
      }
      process.exit()
    }
    if (!runMap[exec]) {
      console.log(
        'The command does not exist, please execute pi -h to view the help',
      )
      return
    }
  }
  const pkg = argv.filter(v => !v.startsWith('-')).join(' ')
  await installDeps()

  runMap[exec](params, pkg)
}

runner()
