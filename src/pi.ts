import { log } from 'node:console'
import process from 'node:process'
import { jsShell, useNodeWorker } from 'lazy-js-utils/node'
import colors from 'picocolors'
import { detectNode } from './detectNode'
import { getInstallCommand, resolvePkgTool } from './pkgManager'
import { getLatestVersion, getParams, loading, pushHistory } from './utils'

const isZh = process.env.PI_Lang === 'zh'

// package install
export async function pi(
  params: string | string[],
  pkg: string,
  executor = 'pi',
) {
  await detectNode()
  const text = pkg ? `Installing ${params} ...` : 'Updating dependency ...'
  const isLatest = executor === 'pil'
  const start = Date.now()
  let successMsg = ''
  if (isLatest) {
    successMsg = await getLatestVersion(pkg, isZh)
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
  const isSilent = process.env.PI_SILENT === 'true'
  let stdio: any = isSilent ? 'inherit' : ['inherit', 'pipe', 'inherit']
  let loading_status: any
  const { PI_DEFAULT, PI_MaxSockets: sockets } = process.env
  const { tool } = await resolvePkgTool()
  // 开启并发下载值
  const maxSockets = sockets || 4
  if (tool === 'npm' && !PI_DEFAULT) {
    stdio = 'inherit'
  }
  else {
    loading_status = await loading(text, isSilent)
  }
  executor = getInstallCommand(tool, Boolean(params))
  const newParams = isLatest ? '' : await getParams(params as string)
  const runSockets
    = tool === 'npm' ? ` --max-sockets=${maxSockets}` : ''
  const latestParams = Array.isArray(params)
    ? params
    : params
      ? [params]
      : []
  const cmdList = isLatest
    ? latestParams.map(p => `${executor} ${p}`)
    : [`${executor}${newParams ? ` ${newParams}` : runSockets}`]
  const runCmd = isLatest ? cmdList.join(' & ') : cmdList[0]
  const runCommands = async (commands: string[]) => {
    const results = await Promise.all(
      commands.map(command =>
        useNodeWorker({
          params: command,
          stdio,
          errorExit: false,
        }),
      ),
    )
    const failed = results.find(r => r.status !== 0)
    const merged = results
      .map(r => r.result)
      .filter(Boolean)
      .join('\n')
    return {
      status: failed ? failed.status : 0,
      result: failed?.result || merged,
    }
  }
  let { status, result } = await runCommands(cmdList)

  if (
    result
    && result.includes('pnpm versions with respective Node.js version support')
  ) {
    log(result)
    log(
      colors.yellow(
        isZh
          ? '正在尝试使用 npm 再次执行...'
          : 'Trying to use npm to run again...',
      ),
    )
    const fallbackCommands = isLatest
      ? latestParams.map(p => `npm install ${p}`)
      : [`npm install${newParams ? ` ${newParams}` : runSockets}`]
    const fallbackResults = await Promise.all(
      fallbackCommands.map(command => jsShell(command, { stdio })),
    )
    const fallbackFailed = fallbackResults.find(r => r.status !== 0)
    const fallbackMerged = fallbackResults
      .map(r => r.result)
      .filter(Boolean)
      .join('\n')
    status = fallbackFailed ? fallbackFailed.status : 0
    result = fallbackFailed?.result || fallbackMerged
  }

  if (stdio === 'inherit')
    loading_status = await loading('')
  const end = Date.now()
  const costTime = (end - start) / 1000
  successMsg += colors.blue(` ---- ⏰：${costTime}s`)
  if (status === 0) {
    loading_status.succeed(colors.green(successMsg))
    pushHistory(runCmd)
  }
  else if (result && result.includes('Not Found - 404')) {
    const _pkg = result.match(/\/[^/:]+:/)?.[0].slice(1, -1)
    const _result = isZh
      ? `${_pkg} 包名可能有误或者版本号不存在，并不能在npm中搜索到，请检查`
      : `${_pkg} the package name may be wrong, and cannot be found in npm, please check`
    loading_status.fail(colors.red(result ? `${failMsg}\n${_result}` : failMsg))
  }
  else {
    loading_status.fail(colors.red(result ? `${failMsg}\n${result}` : failMsg))
  }

  if (result) {
    // 当前workspace 版本需要自动升级
    const reg
      = /ERR_PNPM_NO_MATCHING_VERSION_INSIDE_WORKSPACE\u2009 In : No matching version found for\s+([^@]+)/
    const match = result.match(reg)
    if (match) {
      const dep = match[1]
      jsShell(`pi ${dep}@latest`)
    }
  }

  process.exit()
}
