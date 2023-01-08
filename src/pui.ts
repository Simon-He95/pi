import { useNodeWorker } from 'lazy-js-utils'
import { loading } from './utils'
import type { IJsShell } from './types'
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
