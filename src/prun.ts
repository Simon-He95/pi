import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import color from 'picocolors'
import { getCcommand } from './require'

// package run script
export async function prun(params: string) {
  ensurePrunAutoInit()
  const hadNoHistoryEnv = process.env.CCOMMAND_NO_HISTORY != null || process.env.NO_HISTORY != null
  const initialNoHistory = process.env.CCOMMAND_NO_HISTORY ?? process.env.NO_HISTORY
  const prevNoHistory = process.env.CCOMMAND_NO_HISTORY
  const shouldWriteHistory = !(hadNoHistoryEnv && isNoHistory(initialNoHistory))

  if (shouldWriteHistory)
    delete process.env.CCOMMAND_NO_HISTORY
  else
    process.env.CCOMMAND_NO_HISTORY = '1'
  const { ccommand } = getCcommand()
  try {
    await ccommand(params)
  }
  finally {
    if (prevNoHistory == null)
      delete process.env.CCOMMAND_NO_HISTORY
    else
      process.env.CCOMMAND_NO_HISTORY = prevNoHistory
  }
}

const isZh = process.env.PI_Lang === 'zh'
const safeShellValue = /^[\w./:@%+=,-]+$/

function isNoHistory(value?: string) {
  if (!value)
    return false
  const normalized = value.toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

function shellQuote(value: string) {
  if (value === '')
    return '\'\''
  if (safeShellValue.test(value))
    return value
  return `'${value.replace(/'/g, `'\\''`)}'`
}

function detectShell() {
  const envShell = process.env.SHELL || ''
  if (process.env.FISH_VERSION)
    return 'fish'
  if (process.env.ZSH_VERSION)
    return 'zsh'
  if (process.env.BASH_VERSION)
    return 'bash'
  return envShell.split('/').pop() || 'zsh'
}

function ensurePrunAutoInit() {
  if (!shouldAutoInit())
    return
  const shell = detectShell()
  const home = process.env.HOME || os.homedir()
  let rcFile = ''
  let initLine = ''

  if (shell === 'zsh') {
    const zdotdir = process.env.ZDOTDIR || home
    rcFile = path.join(zdotdir, '.zshrc')
    initLine = 'eval "$(prun --init zsh)"'
  }
  else if (shell === 'bash') {
    rcFile = path.join(home, '.bashrc')
    initLine = 'eval "$(prun --init bash)"'
  }
  else if (shell === 'fish') {
    const configHome = process.env.XDG_CONFIG_HOME || path.join(home, '.config')
    rcFile = path.join(configHome, 'fish', 'config.fish')
    initLine = 'prun --init fish | source'
  }
  else {
    return
  }

  try {
    const dir = path.dirname(rcFile)
    if (!fs.existsSync(dir))
      fs.mkdirSync(dir, { recursive: true })
    const exists = fs.existsSync(rcFile)
    const content = exists ? fs.readFileSync(rcFile, 'utf8') : ''
    if (!/prun\s+--init/.test(content)) {
      const prefix = content.length && !content.endsWith('\n') ? '\n' : ''
      fs.appendFileSync(rcFile, `${prefix}${initLine}\n`, 'utf8')
    }
  }
  catch {
    // ignore auto init failures
  }
}

function shouldAutoInit() {
  const auto = process.env.PI_AUTO_INIT || process.env.PRUN_AUTO_INIT
  if (auto != null)
    return isNoHistory(auto)
  const disable = process.env.PI_NO_AUTO_INIT || process.env.PRUN_NO_AUTO_INIT
  if (isNoHistory(disable))
    return false
  if (process.env.CI)
    return false
  if (!process.stdout.isTTY || !process.stdin.isTTY)
    return false
  return true
}

export function printPrunInit(args: string[] = []) {
  const shellArg = args[0]
  const binArg = args[1]
  const bin = shellQuote(binArg || process.env.PRUN_BIN || 'prun')
  const shell = shellArg || detectShell() || 'zsh'
  let script = ''

  if (shell === 'zsh') {
    script = [
      'prun() {',
      `  local bin=${bin}`,
      '  local -a cmd',
      '  cmd=($' + '{=bin})',
      '  command "$' + '{cmd[@]}" "$@"',
      '  fc -R',
      '}',
    ].join('\n')
  }
  else if (shell === 'bash') {
    script = [
      'prun() {',
      `  local bin=${bin}`,
      '  local -a cmd',
      '  read -r -a cmd <<< "$bin"',
      '  command "$' + '{cmd[@]}" "$@"',
      '  history -n',
      '}',
    ].join('\n')
  }
  else if (shell === 'fish') {
    script = [
      'function prun',
      `  set -l bin ${bin}`,
      '  set -l cmd (string split -- " " $bin)',
      '  command $cmd $argv',
      '  history --merge',
      'end',
    ].join('\n')
  }
  else {
    console.log(
      color.red(
        isZh ? `不支持的 shell: ${shell}` : `Unsupported shell: ${shell}`,
      ),
    )
    return
  }

  console.log(script)
}
