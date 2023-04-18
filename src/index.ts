import process from 'process'
import {
  hasPkg,
  isGo,
  isRust,
  isWin,
  jsShell,
  spaceFormat,
  useNodeWorker,
} from 'lazy-js-utils'
import color from 'picocolors'
import fg from 'fast-glob'
import { loading } from './utils'
import { help } from './help'
import { installDeps } from './installDeps'
import { pi } from './pi'
import { pa } from './pa'
import { pci } from './pci'
import { pfind } from './pfind'
import { pil } from './pil'
import { pinit } from './pinit'
import { pix } from './pix'
import { prun } from './prun'
import { pu } from './pu'
import { pui } from './pui'
import { pio } from './pio'

const rootPath = process.cwd()

const runMap: Record<string, Function> = {
  pi,
  pix,
  pa,
  pui,
  pu,
  pil,
  pci,
  prun,
  pinit,
  pfind,
  pio,
}
const isZh = process.env.PI_Lang === 'zh'

export async function setup() {
  const cmd = process.argv[1]
  let exec = ''
  if (isWin()) {
    const last = cmd.lastIndexOf('\\') + 1
    exec = cmd.slice(last, cmd.length).split('.').slice(0, -1).join('.')
  }
  else {
    const last = cmd.lastIndexOf('/') + 1
    exec = cmd.slice(last, cmd.length)
  }
  const argv: string[] = process.argv.slice(2)
  help(argv)
  const params = spaceFormat(argv.join(' ')).trim()
  if (!hasPkg(rootPath)) {
    if (isGo()) {
      if (exec === 'pi') {
        const loading_status = await loading(
          `${isZh ? '正在为您安装' : 'Installing'} ${params} ...\n`,
        )
        const { status } = await useNodeWorker(`go get ${params}`)
        if (status === 0) {
          loading_status.succeed(
            color.green(isZh ? '安装成功! 😊' : 'Installed successfully! 😊'),
          )
        }
        else {
          loading_status.fail(
            color.red(isZh ? '安装失败 😭' : 'Failed to install 😭'),
          )
        }
      }
      else if (exec === 'pui') {
        const loading_status = await loading(
          `${isZh ? '正在为您卸载' : 'Uninstalling'} ${params} ...\n`,
        )
        const { status } = await useNodeWorker(`go clean ${params}`)
        if (status === 0) {
          loading_status.succeed(
            color.green(isZh ? '卸载成功! 😊' : 'Uninstalled successfully! 😊'),
          )
        }
        else {
          loading_status.fail(
            color.red(isZh ? '卸载失败 😭' : 'Failed to uninstall 😭'),
          )
        }
      }
      else if (exec === 'prun') {
        const match = params
          ? params.endsWith('.go')
            ? [`**/${params}`]
            : [`**/${params}.go`, `**/${params}/main.go`]
          : 'main.go'
        const target = (await fg(match))[0]
        if (!target) {
          console.log(color.red('No such file'))
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
        console.log(
          color.red(
            isZh ? '当前指令还不支持' : 'The commands is not supported',
          ),
        )
      }
      process.exit()
    }
    if (isRust()) {
      if (exec === 'pi') {
        const loading_status = await loading(
          `${isZh ? '正在为您安装' : 'Installing'} ${params} ...\n`,
        )
        const { status } = await useNodeWorker(`cargo install ${params}`)
        if (status === 0) {
          loading_status.succeed(
            color.green(isZh ? '安装成功! 😊' : 'Installed successfully! 😊'),
          )
        }
        else {
          loading_status.fail(
            color.red(isZh ? '安装失败 😭' : 'Failed to install 😭'),
          )
        }
      }
      else if (exec === 'pui') {
        const loading_status = await loading(
          `${isZh ? '正在为您卸载' : 'Uninstalling'} ${params} ...\n`,
        )
        const { status } = await useNodeWorker(`cargo uninstall ${params}`)
        if (status === 0) {
          loading_status.succeed(
            color.green(isZh ? '卸载成功! 😊' : 'Uninstalled successfully! 😊'),
          )
        }
        else {
          loading_status.fail(
            color.red(isZh ? '卸载失败 😭' : 'Failed to uninstall 😭'),
          )
        }
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
        console.log(
          color.red(
            isZh ? '当前指令还不支持' : 'The commands is not supported',
          ),
        )
      }
      process.exit()
    }
    if (!runMap[exec]) {
      console.log(
        color.yellow(
          isZh
            ? '命令不存在，请执行pi -h查看帮助'
            : 'The command does not exist, please execute pi -h to view the help',
        ),
      )
      return
    }
  }
  const pkg = argv.filter(v => !v.startsWith('-')).join(' ')
  await installDeps()

  runMap[exec](params, pkg)
}

setup()
