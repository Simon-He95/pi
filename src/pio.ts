import process from 'node:process'
import { useNodeWorker } from 'lazy-js-utils/node'
import color from 'picocolors'
import { getInstallCommand, resolvePkgTool } from './pkgManager'
import { getParams, loading, runGuardedChild } from './utils'

// package install
export async function pio(params: string, pkg: string) {
  // const text = pkg ? `Installing ${pkg} ...\n` : 'Updating dependency ...\n'
  const successMsg = pkg
    ? `Installed ${pkg} successfully! 😊`
    : 'Updated dependency successfully! 😊'
  const failMsg = pkg
    ? `Failed to install ${pkg} 😭`
    : 'Failed to update dependency! 😭'
  const offline = '--prefer-offline'
  const newParams = await getParams(params)
  const { tool } = await resolvePkgTool()
  const executor = getInstallCommand(tool, Boolean(params))
  const cmd = `${executor}${newParams ? ` ${newParams}` : ''} ${offline}`.trim()
  const { status, result } = await runGuardedChild(() => useNodeWorker({
    params: cmd,
    stdio: 'inherit',
  }))
  const loading_status = await loading('')
  if (status === 0)
    loading_status.succeed(color.green(successMsg))
  else
    loading_status.fail(color.red(result ? `${result}\n\n${failMsg}` : failMsg))

  process.exit()
}
