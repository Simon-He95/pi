import process from 'node:process'
import { getPkg, useNodeWorker } from 'lazy-js-utils/node'
import colors from 'picocolors'
import { getRemoveCommand, resolvePkgTool } from './pkgManager'
import { isInteractive, ttySelect } from './tty'
import { loading } from './utils'

const isZh = process.env.PI_Lang === 'zh'

// package uninstall
export async function pui(params: string, pkg: string) {
  const text = `${isZh ? '正在为您卸载' : 'Uninstalling'} ${pkg} ...`

  if (!params) {
    // 提供当前所有依赖选择
    const { dependencies = {}, devDependencies = {} } = await getPkg()

    const deps = [
      ...Object.keys(dependencies).map(key => `${key}: ${dependencies[key]}`),
      ...Object.keys(devDependencies).map(
        key => `${key}: ${devDependencies[key]}`,
      ),
    ]
    if (!isInteractive()) {
      console.log(
        colors.yellow(
          isZh
            ? '当前不是交互式终端，请直接传入要卸载的依赖。'
            : 'No interactive TTY detected, please pass the dependency name directly.',
        ),
      )
      process.exit(1)
    }
    const choose = await ttySelect(
      deps,
      ` 🤔${
        process.env.PI_Lang === 'zh'
          ? '请选择一个需要删除依赖'
          : 'Please select a dependency to uninstall.'
      }`,
    )
    if (!choose) {
      console.log(colors.dim('已取消'))
      process.exit(0)
    }
    pkg = params = choose.split(': ')[0]
  }

  const start = Date.now()
  let successMsg = isZh
    ? `${pkg}卸载成功! 😊`
    : `UnInstalled ${pkg} successfully! 😊`
  const failMsg = isZh ? `${pkg}卸载失败 😭` : `Failed to uninstall ${pkg} 😭`
  if (!pkg) {
    console.log(
      colors.yellow(
        isZh
          ? '需要指定要卸载的包名！'
          : 'Need to specify an uninstall package name!',
      ),
    )
    process.exit(1)
  }
  const loading_status = await loading(text)
  const { tool } = await resolvePkgTool()
  const removeCmd = getRemoveCommand(tool)
  const { status, result } = await useNodeWorker(`${removeCmd} ${params}`)
  const end = Date.now()
  const costTime = (end - start) / 1000
  successMsg += colors.blue(` ---- ⏰：${costTime}s`)
  if (status === 0)
    loading_status.succeed(colors.green(successMsg))
  else
    loading_status.fail(colors.red(result ? `${failMsg}\n${result}` : failMsg))
  process.exit()
}
