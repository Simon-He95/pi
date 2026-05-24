import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { jsShell } from 'lazy-js-utils/node'
import pc from 'picocolors'

function hasCommand(command: string) {
  const result = process.platform === 'win32'
    ? spawnSync('where', [command], { stdio: 'ignore' })
    : spawnSync('sh', ['-c', `command -v ${command}`], { stdio: 'ignore' })

  return result.status === 0
}

export function pu(params = '') {
  console.warn(
    pc.yellow(
      '[pi] `pu` is deprecated and will be removed in a future release. Use `pil` for latest upgrades, or install/use `nu` directly.',
    ),
  )

  if (!hasCommand('nu')) {
    console.error(
      pc.red(
        '[pi] `pu` delegates to `nu`, but `nu` is not installed. Install the tool that provides `nu`, or use `pil` for latest upgrades instead.',
      ),
    )
    process.exitCode = 1
    return
  }

  return jsShell(`nu${params ? ` ${params}` : ''}`, 'inherit')
}
