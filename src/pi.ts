import { useNodeWorker } from 'lazy-js-utils'
import { getParams, loading } from './utils'
import type { IJsShell } from './types'
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
  const { status, result } = (await useNodeWorker(
    `${executor} ${newParams}`,
  )) as IJsShell
  if (status === 0)
    loading_status.succeed(successMsg)
  else loading_status.fail(result || failMsg)
  process.exit()
}
