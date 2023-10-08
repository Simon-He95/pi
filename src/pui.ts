import { useNodeWorker } from 'lazy-js-utils'
import colors from 'picocolors'
import { loading } from './utils'

const isZh = process.env.PI_Lang === 'zh'

// package uninstall
export async function pui(params: string[], pkg: string) {
  const text = `${isZh ? '正在为您卸载' : 'Uninstalling'} ${pkg} ...`
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
  const { status, result } = await useNodeWorker(`nun ${params}`)
  const end = Date.now()
  const costTime = (end - start) / 1000
  successMsg += colors.blue(` ---- ⏰：${costTime}s`)
  if (status === 0)
    loading_status.succeed(colors.green(successMsg))
  else
    loading_status.fail(colors.red(result ? `${failMsg}\n${result}` : failMsg))
  process.exit()
}
