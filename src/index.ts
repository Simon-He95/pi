import path from 'node:path'
import process from 'node:process'
import fg from 'fast-glob'
import { isWin, spaceFormat } from 'lazy-js-utils'
import {
  hasPkg,
  isGo,
  isRust,
  jsShell,
  useNodeWorker,
} from 'lazy-js-utils/node'
import color from 'picocolors'
import { help } from './help'
import { installDeps } from './installDeps'
import { pa } from './pa'
import { pci } from './pci'
import { pfind } from './pfind'
import { pi } from './pi'
import { pil } from './pil'
import { pinit } from './pinit'
import { pio } from './pio'
import { pix } from './pix'
import { prun } from './prun'
import { pu } from './pu'
import { pui } from './pui'
import { localRequire } from './require'
import { loading } from './utils'

let rootPath = process.cwd()

const runMap: Record<string, (...arg: any) => Promise<void> | void> = {
  pi,
  'pi.mjs': pi,
  pix,
  'pix.mjs': pix,
  pa,
  'pa.mjs': pa,
  pui,
  'pui.mjs': pui,
  pu,
  'pu.mjs': pu,
  pil,
  'pil.mjs': pil,
  pci,
  'pci.mjs': pci,
  prun,
  'prun.mjs': prun,
  pinit,
  'pinit.mjs': pinit,
  pfind,
  'pfind.mjs': pfind,
  pio,
  'pio.mjs': pio,
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
  await help(argv)

  let params = spaceFormat(argv.join(' ')).trim()

  const hasPackage = await hasPkg(rootPath)
  if (!hasPackage) {
    if (await isGo(rootPath)) {
      if (exec === 'pi') {
        const loading_status = await loading(
          `${isZh ? '正在为您安装' : 'Installing'} ${params} ...\n`,
        )
        const { status } = params
          ? await useNodeWorker(`go get ${params}`)
          : await useNodeWorker('go mod tidy')

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

        if (target)
          return await jsShell(`go run ${target}`, 'inherit')
        const { ccommand } = localRequire('ccommand')
        return ccommand(params)
      }
      else if (exec === 'pinit') {
        await jsShell(`go mod init ${params}`, 'inherit')
      }
      else if (exec === 'pbuild') {
        await jsShell(`go build ${params}`, 'inherit')
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
    let projectPath = ''
    if (params && !(await isRust())) {
      // 将 params 的第一个参数作为路径合并到 rootPath，剩余部分作为 params
      projectPath = params.split(' ')[0]
      rootPath = path.resolve(rootPath, projectPath)
      params = params.replace(projectPath, '').trim()
    }
    if (await isRust(rootPath)) {
      if (exec === 'pi') {
        const loading_status = await loading(
          `${isZh ? '正在为您安装' : 'Installing'} ${params} ...\n`,
        )
        const { status } = await useNodeWorker(
          `cargo install ${params}${
            projectPath ? `--manifest-path=./${projectPath}/Cargo.toml` : ''
          }`,
        )
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
        const { status } = await useNodeWorker(
          `cargo uninstall ${params}${
            projectPath ? `--manifest-path=./${projectPath}/Cargo.toml` : ''
          }`,
        )
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
        await jsShell(
          `cargo run ${params}${
            projectPath ? `--manifest-path=./${projectPath}/Cargo.toml` : ''
          }`,
          'inherit',
        )
      }
      else if (exec === 'pinit') {
        await jsShell(
          `cargo init ${params}${
            projectPath ? `--manifest-path=./${projectPath}/Cargo.toml` : ''
          }`,
          'inherit',
        )
      }
      else if (exec === 'pbuild') {
        await jsShell(
          `cargo build ${params}${
            projectPath ? `--manifest-path=./${projectPath}/Cargo.toml` : ''
          }`,
          'inherit',
        )
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
  }
  const handler = runMap[exec]
  if (!handler) {
    if (exec === 'pbuild' || exec === 'pbuild.mjs') {
      console.log(
        color.yellow(
          isZh
            ? 'pbuild 仅支持 Go/Rust 项目（go build / cargo build）。'
            : 'pbuild is only supported for Go/Rust projects (go build / cargo build).',
        ),
      )
    }
    else {
      console.log(
        color.yellow(
          isZh
            ? '命令不存在, 请执行 pi -h 查看帮助'
            : 'The command does not exist, please execute pi -h to view the help',
        ),
      )
    }
    return
  }
  const pkg = argv.filter(v => !v.startsWith('-')).join(' ')
  await installDeps()
  await handler(params, pkg)
}

if (!process.env.PI_TEST) {
  setup().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
