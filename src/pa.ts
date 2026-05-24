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

export function pa(params = '') {
  console.warn(
    pc.yellow(
      '[pi] `pa` is deprecated and only kept as a compatibility bridge to `na`. Install/use `na` directly if you still need that workflow.',
    ),
  )

  if (!hasCommand('na')) {
    console.error(
      pc.red(
        '[pi] `pa` delegates to `na`, but `na` is not installed. Install the package that provides `na`, or stop using the deprecated `pa` alias.',
      ),
    )
    process.exitCode = 1
    return
  }

  return jsShell(`na${params ? ` ${params}` : ''}`, 'inherit')
}
