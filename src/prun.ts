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
  const { ccommand } = getCcommand()
  const prevNoHistory = process.env.CCOMMAND_NO_HISTORY
  const shouldWriteHistory = !(hadNoHistoryEnv && isNoHistory(initialNoHistory))
  const { lines, restore } = captureOutput()

  process.env.CCOMMAND_NO_HISTORY = '1'
  try {
    await ccommand(params)
  }
  finally {
    restore()
    if (prevNoHistory == null)
      delete process.env.CCOMMAND_NO_HISTORY
    else
      process.env.CCOMMAND_NO_HISTORY = prevNoHistory
  }

  const shortcut = extractShortcutCommand(lines())
  if (shortcut && shouldWriteHistory)
    writeShellHistory(shortcut)
}

const isZh = process.env.PI_Lang === 'zh'
const safeShellValue = /^[\w./:@%+=,-]+$/
const ansiEscape = String.fromCharCode(0x1B)
const ansiRegex = new RegExp(`${ansiEscape}\\[[0-9;]*m`, 'g')
const statusSuffixes = ['run successfully', '运行成功', 'run error', '运行失败']

function stripAnsi(value: string) {
  return value.replace(ansiRegex, '')
}

function captureOutput() {
  const stdoutWrite = process.stdout.write.bind(process.stdout)
  const stderrWrite = process.stderr.write.bind(process.stderr)
  let buffer = ''
  const output: string[] = []

  const pushBufferLines = () => {
    let idx = buffer.indexOf('\n')
    while (idx !== -1) {
      output.push(buffer.slice(0, idx))
      buffer = buffer.slice(idx + 1)
      idx = buffer.indexOf('\n')
    }
  }

  process.stdout.write = ((chunk: any, encoding?: any, cb?: any) => {
    const text = typeof chunk === 'string'
      ? chunk
      : chunk?.toString(encoding || 'utf8')
    if (text) {
      buffer += text
      pushBufferLines()
    }
    return stdoutWrite(chunk, encoding, cb)
  }) as typeof process.stdout.write

  process.stderr.write = ((chunk: any, encoding?: any, cb?: any) => {
    const text = typeof chunk === 'string'
      ? chunk
      : chunk?.toString(encoding || 'utf8')
    if (text) {
      buffer += text
      pushBufferLines()
    }
    return stderrWrite(chunk, encoding, cb)
  }) as typeof process.stderr.write

  const restore = () => {
    if (buffer.trim())
      output.push(buffer)
    buffer = ''
    process.stdout.write = stdoutWrite
    process.stderr.write = stderrWrite
  }

  return {
    lines: () => output.slice(),
    restore,
  }
}

function isNoHistory(value?: string) {
  if (!value)
    return false
  const normalized = value.toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

function stripTrailingNonAscii(value: string) {
  let end = value.length
  while (end > 0) {
    const code = value.charCodeAt(end - 1)
    if (code <= 0x7F)
      break
    end -= 1
  }
  return end === value.length ? value : value.slice(0, end)
}

function stripStatusSuffix(value: string) {
  const trimmed = value.trim()
  const lower = trimmed.toLowerCase()
  for (const suffix of statusSuffixes) {
    const suffixLower = suffix.toLowerCase()
    if (lower.endsWith(suffixLower)) {
      return trimmed.slice(0, trimmed.length - suffix.length).trimEnd()
    }
  }
  return trimmed
}

function extractShortcutCommand(logs: string[]) {
  for (let i = logs.length - 1; i >= 0; i--) {
    const line = stripAnsi(logs[i]).trim()
    if (!line)
      continue
    const shortcutMatch = line.match(/(?:shortcut command|快捷指令)\s*:\s*(prun\b.*)$/i)
    if (shortcutMatch)
      return shortcutMatch[1].trim()
    const runningMatch = line.match(/(?:is running for you\.\.\.|正在为您执行\.{3})\s+(\S.*)$/i)
    if (runningMatch) {
      const command = runningMatch[1].trim()
      if (command)
        return command.startsWith('prun ') ? command : `prun ${command}`
    }
    const clean = stripTrailingNonAscii(line).trim()
    const unquoted = clean.replace(/^['"]|['"]$/g, '')
    const sanitized = stripStatusSuffix(unquoted)
    if (sanitized.startsWith('prun '))
      return sanitized
    if (sanitized === 'prun')
      return sanitized
    const idx = sanitized.lastIndexOf('prun ')
    if (idx !== -1)
      return sanitized.slice(idx).trim()
  }
  return ''
}

function resolveHistoryTarget() {
  const shellEnv = process.env.SHELL || '/bin/bash'
  const shellName = (process.env.FISH_VERSION && 'fish')
    || (process.env.ZSH_VERSION && 'zsh')
    || (process.env.BASH_VERSION && 'bash')
    || shellEnv.split('/').pop()
    || 'bash'
  const home = process.env.HOME || os.homedir()
  const histFileEnv = process.env.HISTFILE
  const xdgDataHome = process.env.XDG_DATA_HOME
  let historyFile = ''
  let historyKind: 'zsh' | 'bash' | 'fish' = 'bash'

  if (shellName === 'zsh') {
    historyKind = 'zsh'
    historyFile = histFileEnv || path.join(home, '.zsh_history')
  }
  else if (shellName === 'fish') {
    historyKind = 'fish'
    const base = xdgDataHome || path.join(home, '.local', 'share')
    historyFile = path.join(base, 'fish', 'fish_history')
  }
  else {
    historyKind = 'bash'
    historyFile = histFileEnv || path.join(home, '.bash_history')
  }

  return { historyFile, historyKind }
}

function buildHistoryEntry(command: string, kind: 'zsh' | 'bash' | 'fish') {
  const timestamp = Math.floor(Date.now() / 1000)
  if (kind === 'zsh')
    return `: ${timestamp}:0;${command}\n`
  if (kind === 'fish')
    return `- cmd: ${command}\n  when: ${timestamp}\n`
  if (process.env.HISTTIMEFORMAT)
    return `#${timestamp}\n${command}\n`
  return `${command}\n`
}

function writeShellHistory(command: string) {
  try {
    const { historyFile, historyKind } = resolveHistoryTarget()
    if (!historyFile)
      return
    if (!fs.existsSync(historyFile)) {
      console.log(
        color.yellow(
          isZh
            ? `未找到 history 文件: ${historyFile}`
            : `History file not found: ${historyFile}`,
        ),
      )
      return
    }
    const entry = buildHistoryEntry(command, historyKind)
    fs.appendFileSync(historyFile, entry, 'utf8')
  }
  catch (error) {
    console.log(
      color.red(
        `${isZh ? '写入 history 失败' : 'Failed to write history'}${error ? `: ${String(error)}` : ''}`,
      ),
    )
  }
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
