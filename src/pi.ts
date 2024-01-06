import process from 'process'
import { getPkgTool, jsShell, useNodeWorker } from 'lazy-js-utils'
import colors from 'picocolors'
import { getLatestVersion, getParams, loading } from './utils'
import { detectNode } from './detectNode'

const isZh = process.env.PI_Lang === 'zh'

// package install
export async function pi(params: string, pkg: string, executor = 'ni') {
  await detectNode()
  const text = pkg ? `Installing ${params} ...` : 'Updating dependency ...'
  const isLatest = executor === 'pil'
  const start = Date.now()

  let successMsg = ''
  if (isLatest) {
    successMsg = getLatestVersion(pkg, isZh)
  }
  else {
    successMsg = pkg
      ? isZh
        ? `${pkg} 安装成功! 😊`
        : `Installed ${pkg} successfully! 😊`
      : isZh
        ? '依赖更新成功! 😊'
        : 'Updated dependency successfully! 😊'
  }

  const failMsg = pkg
    ? isZh
      ? `${params} 安装失败 😭`
      : `Failed to install ${params} 😭`
    : isZh
      ? '依赖更新失败 😭'
      : 'Failed to update dependency 😭'
  const newParams = isLatest ? params : await getParams(params)
  let stdio: any = 'pipe'
  let loading_status: any
  const { PI_DEFAULT, PI_MaxSockets: sockets } = process.env
  const pkgTool = await getPkgTool()
  // 开启并发下载值
  const maxSockets = sockets || 4
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
      executor = 'ni'
    }
  }
  else {
    executor = `${pkgTool} ${install}`
    loading_status = await loading(text)
  }

  const runSockets
    = executor.split(' ')[0] === 'npm' ? ` --max-sockets=${maxSockets}` : ''
  const { status, result } = await useNodeWorker({
    params: `${executor}${newParams ? ` ${newParams}` : runSockets}`,
    stdio,
  })

  if (stdio === 'inherit')
    loading_status = await loading('')
  const end = Date.now()
  const costTime = (end - start) / 1000
  successMsg += colors.blue(` ---- ⏰：${costTime}s`)
  if (status === 0) {
    loading_status.succeed(colors.green(successMsg))
  }
  else if (result && result.includes('Not Found - 404')) {
    const _result = isZh
      ? `${pkg} 包名可能有误，并不能在npm中搜索到，请检查`
      : `${pkg} the package name may be wrong, and cannot be found in npm, please check`
    loading_status.fail(colors.red(result ? `${failMsg}\n${_result}` : failMsg))
  }
  else {
    loading_status.fail(colors.red(result ? `${failMsg}\n${result}` : failMsg))
  }

  if (result) {
    // 当前workspace 版本需要自动升级
    const reg
      = /ERR_PNPM_NO_MATCHING_VERSION_INSIDE_WORKSPACE  In : No matching version found for\s+([^@]+)/
    const match = result.match(reg)
    if (match) {
      const dep = match[1]
      jsShell(`pi ${dep}@latest`)
    }
  }

  process.exit()
}
