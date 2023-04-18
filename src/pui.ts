import { useNodeWorker } from 'lazy-js-utils'
import color from 'picocolors'
import { loading } from './utils'

const isZh = process.env.PI_Lang === 'zh'

// package uninstall
export async function pui(params: string[], pkg: string) {
  const text = `${isZh ? '正在为您卸载' : 'Uninstalling'} ${pkg} ...`
  const successMsg = isZh
    ? `${pkg}卸载成功! 😊`
    : `UnInstalled ${pkg} successfully! 😊`
  const failMsg = isZh ? `${pkg}卸载失败 😭` : `Failed to uninstall ${pkg} 😭`
  if (!pkg) {
    console.log('Need to specify an uninstall package name')
    process.exit(1)
  }
  const loading_status = await loading(text)
  const { status } = await useNodeWorker(`nun ${params}`)
  if (status === 0)
    loading_status.succeed(color.green(successMsg))
  else loading_status.fail(color.red(failMsg))
  process.exit()
}
