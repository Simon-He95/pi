import process from 'process'
import { useNodeWorker } from 'lazy-js-utils/dist/node'
import color from 'picocolors'
import { getParams, loading } from './utils'

// package install
export async function pio(params: string, pkg: string, executor = 'ni') {
  // const text = pkg ? `Installing ${pkg} ...\n` : 'Updating dependency ...\n'
  const successMsg = pkg
    ? `Installed ${pkg} successfully! 😊`
    : 'Updated dependency successfully! 😊'
  const failMsg = pkg
    ? `Failed to install ${pkg} 😭`
    : 'Failed to update dependency! 😭'
  const offline = '--prefer-offline'
  const newParams = await getParams(params)
  const { status, result } = await useNodeWorker({
    params: `${executor} ${newParams} ${offline}`,
    stdio: 'inherit',
  })
  const loading_status = await loading('')
  if (status === 0)
    loading_status.succeed(color.green(successMsg))
  else
    loading_status.fail(color.red(result ? `${result}\n\n${failMsg}` : failMsg))

  process.exit()
}
