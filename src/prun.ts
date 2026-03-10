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

function powerShellQuote(value: string) {
  if (value === '')
    return '\'\''
  return `'${value.replace(/'/g, '\'\'')}'`
}

function splitCommand(value: string) {
  const parts: string[] = []
  let current = ''
  let quote: '"' | '\'' | null = null
  let hasValue = false

  const pushCurrent = () => {
    if (!hasValue)
      return
    parts.push(current)
    current = ''
    hasValue = false
  }

  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (quote) {
      if (char === quote) {
        quote = null
        hasValue = true
        continue
      }
      if (quote === '"' && char === '\\') {
        const next = value[i + 1]
        if (next) {
          current += next
          hasValue = true
          i++
          continue
        }
      }
      current += char
      hasValue = true
      continue
    }

    if (char === '"' || char === '\'') {
      quote = char as '"' | '\''
      hasValue = true
      continue
    }

    if (/\s/.test(char)) {
      pushCurrent()
      while (i + 1 < value.length && /\s/.test(value[i + 1]))
        i++
      continue
    }

    if (char === '\\') {
      const next = value[i + 1]
      if (next) {
        current += next
        hasValue = true
        i++
        continue
      }
    }

    current += char
    hasValue = true
  }

  pushCurrent()
  return parts
}

function normalizeShellName(value?: string) {
  const shell = (value || '').toLowerCase().replace(/\.exe$/, '')
  if (shell === 'powershell')
    return 'powershell'
  if (shell === 'pwsh')
    return 'pwsh'
  if (shell === 'fish' || shell === 'zsh' || shell === 'bash')
    return shell
  return shell
}

function detectShell() {
  const envShell = normalizeShellName(path.basename(process.env.SHELL || ''))
  if (process.env.FISH_VERSION)
    return 'fish'
  if (process.env.ZSH_VERSION)
    return 'zsh'
  if (process.env.BASH_VERSION)
    return 'bash'
  if (process.env.POWERSHELL_DISTRIBUTION_CHANNEL)
    return 'pwsh'
  if (envShell)
    return envShell
  if (process.platform === 'win32')
    return 'powershell'
  return 'zsh'
}

function getPowerShellProfilePath(shell: 'powershell' | 'pwsh', home: string) {
  if (process.platform === 'win32') {
    const documentsHome = process.env.USERPROFILE || home
    const profileDir = shell === 'pwsh' ? 'PowerShell' : 'WindowsPowerShell'
    return path.join(documentsHome, 'Documents', profileDir, 'Microsoft.PowerShell_profile.ps1')
  }
  const configHome = process.env.XDG_CONFIG_HOME || path.join(home, '.config')
  return path.join(configHome, 'powershell', 'Microsoft.PowerShell_profile.ps1')
}

export function ensurePrunAutoInit() {
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
  else if (shell === 'powershell' || shell === 'pwsh') {
    rcFile = getPowerShellProfilePath(shell, home)
    initLine = `prun --init ${shell} | Out-String | Invoke-Expression`
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
  const shellArg = normalizeShellName(args[0])
  const binArg = args[1] || process.env.PRUN_BIN || 'prun'
  const bin = shellQuote(binArg)
  const shell = shellArg || detectShell() || 'zsh'
  const historyHintExpr = '$'
    + '{CCOMMAND_HISTORY_HINT:-$'
    + '{XDG_CACHE_HOME:-$HOME/.cache}/ccommand/last-history}'
  let script = ''

  if (shell === 'zsh') {
    script = [
      'prun() {',
      `  local bin=${bin}`,
      '  local -a cmd',
      '  cmd=($' + '{=bin})',
      '  command "$' + '{cmd[@]}" "$@"',
      '}',
      '__prun_sync_history() {',
      '  local history_disable=$' + '{CCOMMAND_NO_HISTORY:-$' + '{NO_HISTORY:-""}}',
      '  local history_disable_lower=$' + '{history_disable:l}',
      '  if [[ $history_disable_lower == "1" || $history_disable_lower == "true" || $history_disable_lower == "yes" ]]; then',
      '    return',
      '  fi',
      `  local history_hint=${historyHintExpr}`,
      '  if [[ ! -f $history_hint ]]; then',
      '    return',
      '  fi',
      '  local line',
      '  line=$(<"$history_hint")',
      '  local hint_ts=$' + '{line%%$\'\\t\'*}',
      '  local hint_cmd=$' + '{line#*$\'\\t\'}',
      '  if [[ -z $hint_ts || $hint_ts == $line ]]; then',
      '    hint_cmd=$line',
      '    hint_ts=""',
      '  fi',
      '  if [[ -n $hint_ts && $hint_ts == $' + '{__PRUN_HISTORY_HINT_TS:-""} ]]; then',
      '    return',
      '  fi',
      '  __PRUN_HISTORY_HINT_TS=$hint_ts',
      '  fc -R',
      '  if [[ $hint_cmd != pfind* && $hint_cmd != prun* ]]; then',
      '    return',
      '  fi',
      '  local last_line',
      '  last_line=$(fc -l -1 2>/dev/null)',
      '  local last_cmd',
      '  last_cmd=$(printf "%s" "$last_line" | sed -E "s/^[[:space:]]*[0-9]+[[:space:]]*//")',
      '  if [[ $last_cmd == "$hint_cmd" ]]; then',
      '    return',
      '  fi',
      '  if [[ $last_cmd == prun || $last_cmd == prun\\ * ]]; then',
      '    local last_num',
      '    last_num=$(printf "%s" "$last_line" | sed -E "s/^[[:space:]]*([0-9]+).*/\\1/")',
      '    if [[ -n $last_num ]]; then',
      '      history -d $last_num 2>/dev/null',
      '    fi',
      '  fi',
      '  print -s -- "$hint_cmd"',
      '}',
      '',
      'if ! typeset -f __prun_precmd >/dev/null; then',
      '  __prun_precmd() { __prun_sync_history }',
      '  autoload -Uz add-zsh-hook',
      '  add-zsh-hook precmd __prun_precmd',
      'fi',
    ].join('\n')
  }
  else if (shell === 'bash') {
    script = [
      'prun() {',
      `  local bin=${bin}`,
      '  local -a cmd',
      '  read -r -a cmd <<< "$bin"',
      '  command "$' + '{cmd[@]}" "$@"',
      '}',
      '__prun_sync_history() {',
      '  local history_disable=$' + '{CCOMMAND_NO_HISTORY:-$' + '{NO_HISTORY:-""}}',
      '  local history_disable_lower',
      '  history_disable_lower=$(printf \'%s\' "$history_disable" | tr \'[:upper:]\' \'[:lower:]\')',
      '  if [[ $history_disable_lower == "1" || $history_disable_lower == "true" || $history_disable_lower == "yes" ]]; then',
      '    return',
      '  fi',
      `  local history_hint=${historyHintExpr}`,
      '  if [[ ! -f $history_hint ]]; then',
      '    return',
      '  fi',
      '  local line',
      '  line=$(<"$history_hint")',
      '  local hint_ts="$' + '{line%%$\'\\t\'*}"',
      '  local hint_cmd="$' + '{line#*$\'\\t\'}"',
      '  if [[ -z $hint_ts || $hint_ts == "$line" ]]; then',
      '    hint_cmd="$line"',
      '    hint_ts=""',
      '  fi',
      '  if [[ -n $hint_ts && $hint_ts == "$' + '{__PRUN_HISTORY_HINT_TS:-}" ]]; then',
      '    return',
      '  fi',
      '  __PRUN_HISTORY_HINT_TS=$hint_ts',
      '  if [[ $hint_cmd != pfind* && $hint_cmd != prun* ]]; then',
      '    return',
      '  fi',
      '  history -n',
      '  local last_line',
      '  last_line=$(history 1)',
      '  local last_cmd',
      '  last_cmd=$(printf "%s" "$last_line" | sed -E "s/^[[:space:]]*[0-9]+[[:space:]]*//")',
      '  if [[ $last_cmd == "$hint_cmd" ]]; then',
      '    return',
      '  fi',
      '  if [[ $last_cmd == prun || $last_cmd == prun\\ * ]]; then',
      '    local last_num',
      '    last_num=$(printf "%s" "$last_line" | sed -E "s/^[[:space:]]*([0-9]+).*/\\1/")',
      '    if [[ -n $last_num ]]; then',
      '      history -d "$last_num" 2>/dev/null',
      '    fi',
      '  fi',
      '  history -s -- "$hint_cmd"',
      '}',
      '',
      'if [[ -z "$' + '{__PRUN_PROMPT_INSTALLED:-}" ]]; then',
      '  __PRUN_PROMPT_INSTALLED=1',
      '  if [[ -n "$' + '{PROMPT_COMMAND:-}" ]]; then',
      '    PROMPT_COMMAND="__prun_sync_history;$' + '{PROMPT_COMMAND}"',
      '  else',
      '    PROMPT_COMMAND="__prun_sync_history"',
      '  fi',
      'fi',
    ].join('\n')
  }
  else if (shell === 'fish') {
    script = [
      'function prun',
      `  set -l bin ${bin}`,
      '  set -l cmd (string split -- " " $bin)',
      '  command $cmd $argv',
      '  set -l history_disable $CCOMMAND_NO_HISTORY',
      '  if test -z "$history_disable"',
      '    set history_disable $NO_HISTORY',
      '  end',
      '  set history_disable (string lower -- (string trim -- "$history_disable"))',
      '  if test "$history_disable" != "1" -a "$history_disable" != "true" -a "$history_disable" != "yes"',
      '    history --merge',
      '    set -l history_hint $CCOMMAND_HISTORY_HINT',
      '    if test -z "$history_hint"',
      '      set -l cache_home $XDG_CACHE_HOME',
      '      if test -z "$cache_home"',
      '        set cache_home "$HOME/.cache"',
      '      end',
      '      set history_hint "$cache_home/ccommand/last-history"',
      '    end',
      '    if test -f "$history_hint"',
      '      set -l last_cmd (string trim -- (cat "$history_hint"))',
      '      set -l last_cmd (string replace -r "^[0-9]+\\t" "" -- "$last_cmd")',
      '      if string match -q "pfind*" -- "$last_cmd"; or string match -q "prun*" -- "$last_cmd"',
      '        set -l last_hist (history --max=1)',
      '        if test "$last_hist" != "$last_cmd"',
      '          history add -- "$last_cmd"',
      '        end',
      '      end',
      '    end',
      '  end',
      'end',
    ].join('\n')
  }
  else if (shell === 'powershell' || shell === 'pwsh') {
    const powerShellBin = splitCommand(binArg).map(powerShellQuote).join(', ')
    script = [
      `$script:__prun_bin = @(${powerShellBin || powerShellQuote('prun')})`,
      '',
      'function global:prun {',
      '  param([Parameter(ValueFromRemainingArguments = $true)] [string[]] $CliArgs)',
      '  $command = $script:__prun_bin[0]',
      '  if ($command -ieq "prun") {',
      '    $resolved = Get-Command -Name $command -CommandType Application,ExternalScript -ErrorAction SilentlyContinue | Select-Object -First 1',
      '    if ($null -ne $resolved) {',
      '      if ($resolved.Path) { $command = $resolved.Path }',
      '      elseif ($resolved.Definition) { $command = $resolved.Definition }',
      '      elseif ($resolved.Source) { $command = $resolved.Source }',
      '    }',
      '  }',
      '  $extra = @()',
      '  if ($script:__prun_bin.Count -gt 1) {',
      '    $extra = $script:__prun_bin[1..($script:__prun_bin.Count - 1)]',
      '  }',
      '  & $command @extra @CliArgs',
      '}',
      '',
      'function global:__prun_sync_history {',
      '  $historyDisable = $env:CCOMMAND_NO_HISTORY',
      '  if ([string]::IsNullOrWhiteSpace($historyDisable)) {',
      '    $historyDisable = $env:NO_HISTORY',
      '  }',
      '  $historyDisable = "$historyDisable".Trim().ToLowerInvariant()',
      '  if ($historyDisable -eq "1" -or $historyDisable -eq "true" -or $historyDisable -eq "yes") {',
      '    return',
      '  }',
      '  $historyHint = $env:CCOMMAND_HISTORY_HINT',
      '  if ([string]::IsNullOrWhiteSpace($historyHint)) {',
      '    $cacheHome = $env:XDG_CACHE_HOME',
      '    if ([string]::IsNullOrWhiteSpace($cacheHome)) {',
      '      $cacheHome = Join-Path $HOME ".cache"',
      '    }',
      '    $historyHint = Join-Path (Join-Path $cacheHome "ccommand") "last-history"',
      '  }',
      '  if (-not (Test-Path -LiteralPath $historyHint)) {',
      '    return',
      '  }',
      '  $line = (Get-Content -LiteralPath $historyHint -Raw -ErrorAction SilentlyContinue)',
      '  if ([string]::IsNullOrWhiteSpace($line)) {',
      '    return',
      '  }',
      '  $line = $line.Trim()',
      '  $hintTs = ""',
      '  $hintCmd = $line',
      '  $parts = $line -split "`t", 2',
      '  if ($parts.Count -eq 2 -and $parts[0] -match "^\\d+$") {',
      '    $hintTs = $parts[0]',
      '    $hintCmd = $parts[1]',
      '  }',
      '  if (-not $hintCmd.StartsWith("prun") -and -not $hintCmd.StartsWith("pfind")) {',
      '    return',
      '  }',
      '  if ($hintTs -and $script:__PRUN_HISTORY_HINT_TS -eq $hintTs) {',
      '    return',
      '  }',
      '  $script:__PRUN_HISTORY_HINT_TS = $hintTs',
      '  $psReadLineType = "Microsoft.PowerShell.PSConsoleReadLine" -as [type]',
      '  if ($null -eq $psReadLineType) {',
      '    return',
      '  }',
      '  $psReadLineType::AddToHistory($hintCmd)',
      '}',
      '',
      'if (-not $script:__PRUN_PROMPT_INSTALLED) {',
      '  $script:__PRUN_PROMPT_INSTALLED = $true',
      '  if (-not $script:__prun_original_prompt) {',
      '    if (Test-Path Function:\\prompt) {',
      '      $script:__prun_original_prompt = $function:prompt',
      '    }',
      '  }',
      '  function global:prompt {',
      '    __prun_sync_history',
      '    if ($script:__prun_original_prompt) {',
      '      & $script:__prun_original_prompt',
      '      return',
      '    }',
      '    "PS $($executionContext.SessionState.Path.CurrentLocation)> "',
      '  }',
      '}',
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
