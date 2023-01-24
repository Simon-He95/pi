import process from 'process'
import { useNodeWorker } from 'lazy-js-utils'
import { getParams, loading } from './utils'
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
  const { status, result } = await useNodeWorker(`${executor} ${newParams}`)
  if (status === 0)
    loading_status.succeed(successMsg)
  else loading_status.fail(`${result}\n\n${failMsg}`)

  process.exit()
}
