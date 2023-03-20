import process from 'process'
import { getPkgTool, jsShell, useNodeWorker } from 'lazy-js-utils'
import colors from 'picocolors'
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
  let stdio: any = 'pipe'
  let loading_status: any
  const { result: PI_DEFAULT } = await jsShell('echo $PI_DEFAULT', 'pipe')
  const pkgTool = await getPkgTool()
  const install
    = PI_DEFAULT === 'yarn' || pkgTool === 'yarn'
      ? newParams
        ? 'add'
        : ''
      : 'install'
  if (pkgTool === 'npm') {
    if (PI_DEFAULT) {
      executor = `${PI_DEFAULT} ${install}`
      loading_status = await loading(text)
    }
    else {
      stdio = 'inherit'
    }
  }
  else {
    executor = `${pkgTool} ${install}`
    loading_status = await loading(text)
  }

  const { status, result } = await useNodeWorker({
    params: `${executor}${newParams ? ` ${newParams}` : ''}`,
    stdio,
  })

  if (stdio === 'inherit')
    loading_status = await loading('')

  if (status === 0) {
    loading_status.succeed(colors.green(successMsg))
  }
  else {
    loading_status.fail(
      colors.red(result ? `${result}\n\n${failMsg}` : failMsg),
    )
  }

  if (result) {
    // 当前workspace 版本需要自动升级
    const reg = / No matching version found for ([\w\-\_@\^.]+)/
    const match = result.match(reg)
    if (match) {
      const dep = match[1]
      jsShell(`pi ${dep}`)
    }
  }

  process.exit()
}
