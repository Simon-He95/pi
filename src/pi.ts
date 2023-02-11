import process from 'process'
import { useNodeWorker } from 'lazy-js-utils'
import colors from 'picocolors'
import { getParams, loading } from './utils'

// package install
export async function pi(params: string, pkg: string, executor = 'ni') {
  // const text = pkg ? `Installing ${pkg} ...\n` : 'Updating dependency ...\n'
  const successMsg = pkg
    ? `Installed ${pkg} successfully! 😊`
    : 'Updated dependency successfully! 😊'
  const failMsg = pkg
    ? `Failed to install ${pkg} 😭`
    : 'Failed to update dependency! 😭'

  const newParams = await getParams(params)

  const { status, result } = await useNodeWorker({
    params: `${executor} ${newParams}`,
    stdio: 'inherit',
  })
  const loading_status = await loading('')

  if (status === 0) {
    loading_status.succeed(colors.green(successMsg))
  }
  else {
    loading_status.fail(
      colors.red(result ? `${result}\n\n${failMsg}` : failMsg),
    )
  }

  process.exit()
}
