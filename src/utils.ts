import type { Color, Spinner } from 'ora'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { isFile } from 'lazy-js-utils'
import { getPkg, getPkgTool, jsShell } from 'lazy-js-utils/node'
// import ora from 'ora'
import colors from 'picocolors'

const DW = /\s-DW/g
const W = /\s-W/g
const Dw = /\s-Dw/g
const w = /\s-w/g
const D = /\s-D(?!w)/g
const d = /\s-d(?!w)/g
const isZh = process.env.PI_Lang === 'zh'
export const log = console.log
export async function getParams(params: string) {
  const root = process.cwd()
  try {
    switch (await getPkgTool()) {
      case 'pnpm':
        if (!isFile(path.resolve(root, './pnpm-workspace.yaml'))) {
          if (DW.test(params))
            return params.replace(DW, ' -D')
          if (Dw.test(params))
            return params.replace(Dw, ' -D')
          if (W.test(params))
            return params.replace(W, '')
          if (w.test(params))
            return params.replace(w, '')
          if (d.test(params))
            return params.replace(d, ' -D')
        }
        if (isFile('./pnpm-workspace.yaml')) {
          if (D.test(params))
            return params.replace(D, ' -Dw')
          if (d.test(params))
            return params.replace(d, ' -Dw')
          if (!params || Dw.test(params) || w.test(params))
            return params
          return `${params} -w`
        }

        if (DW.test(params))
          return params.replace(DW, ' -Dw')
        if (W.test(params))
          return params.replace(W, ' -w')

        return params
      case 'yarn':
        if (!(await getPkg(path.resolve(root, './package.json')))?.workspaces) {
          if (Dw.test(params))
            return params.replace(Dw, ' -D')
          if (DW.test(params))
            return params.replace(DW, ' -D')
          if (W.test(params))
            return params.replace(W, '')
          if (w.test(params))
            return params.replace(w, '')
          // Normalize lowercase -d to -D in non-workspace yarn projects
          if (d.test(params))
            return params.replace(d, ' -D')
        }

        if ((await getPkg())?.workspaces) {
          if (D.test(params))
            return params.replace(D, ' -DW')
          if (d.test(params))
            return params.replace(d, ' -DW')
          if (!params || W.test(params) || DW.test(params))
            return params
          return `${params} -W`
        }

        if (Dw.test(params))
          return params.replace(Dw, ' -DW')
        if (W.test(params))
          return params.replace(W, ' -W')
        return params
      default:
        // Normalize lowercase -d to -D for npm or any other package manager fallback
        return d.test(params) ? params.replace(d, ' -D') : params
    }
  }
  catch {
    console.log(
      colors.red(
        `${
          isZh
            ? 'package.json并不存在,在以下目录中:'
            : 'package.json has not been found in'
        } ${process.cwd()}`,
      ),
    )
    process.exit(1)
  }
}

export async function loading(text: string, isSilent = false) {
  const { color, spinner } = await getStyle()
  const ora = (await import('ora')).default
  return ora({
    text,
    spinner,
    color,
    isSilent,
    discardStdin: true,
  }).start()
}

export async function getStyle() {
  const { PI_COLOR: color = 'yellow', PI_SPINNER: spinner = 'star' }
    = process.env
  return {
    color,
    spinner,
  } as unknown as { color: Color, spinner: Spinner }
}

export async function getLatestVersion(pkg: string, isZh = true) {
  const data: string[] = []

  for (const p of pkg.replace(/\s+/, ' ').split(' ')) {
    const [pName, v] = p.split('$')
    let { status, result } = await jsShell(`npm view ${pName}`, [
      'inherit',
      'pipe',
      'inherit',
    ])
    if (status === 0) {
      if (result.startsWith('@'))
        result = result.slice(1)
      const item = isZh
        ? `${pName} ${colors.gray(v)} -> ${result.match(/@(\S+)/)![1]}`
        : `Installed ${pName} ${colors.dim(v)} -> latest version：${
          result.match(/@(\S+)/)![1]
        }`
      data.push(item)
    }
    else {
      throw new Error(result)
    }
  }
  return `${data.join(' ')}${isZh ? ' 安装成功! 😊' : ' successfully! 😊'}`
}

export async function pushHistory(command: string) {
  log(
    colors.bold(
      colors.blue(`${isZh ? '快捷指令' : 'shortcut command'}: ${command}`),
    ),
  )

  // 检测当前shell类型
  const currentShell = process.env.SHELL || '/bin/bash'
  const shellName = currentShell.split('/').pop() || 'bash'

  // 根据不同shell确定history文件路径和格式
  let historyFile = ''
  let historyFormat: 'zsh' | 'bash' | 'fish' = 'bash'

  const home = process.env.HOME || os.homedir()

  switch (shellName) {
    case 'zsh':
      historyFile = path.join(home, '.zsh_history')
      historyFormat = 'zsh'
      break
    case 'bash':
      historyFile = process.env.HISTFILE || path.join(home, '.bash_history')
      historyFormat = 'bash'
      break
    case 'fish':
      historyFile = path.join(home, '.local', 'share', 'fish', 'fish_history')
      historyFormat = 'fish'
      break
    default:
      // 默认使用bash格式
      historyFile = process.env.HISTFILE || path.join(home, '.bash_history')
      historyFormat = 'bash'
  }

  try {
    // Use synchronous check to avoid async hanging issues with locked files
    if (!fs.existsSync(historyFile)) {
      log(
        colors.yellow(
          `${
            isZh
              ? `未找到 ${shellName} 历史文件`
              : `${shellName} history file not found`
          }`,
        ),
      )
      return
    }

    // Use synchronous read to avoid async hanging with locked files
    const raw = fs.readFileSync(historyFile, 'utf8')
    const timestamp = Math.floor(Date.now() / 1000)

    // 根据格式生成 newEntry（保持与原实现兼容）
    let newEntry = ''
    if (historyFormat === 'zsh') {
      newEntry = `: ${timestamp}:0;${command}`
    }
    else if (historyFormat === 'fish') {
      newEntry = `- cmd: ${command}\n  when: ${timestamp}`
    }
    else {
      if (process.env.HISTTIMEFORMAT) {
        newEntry = `#${timestamp}\n${command}`
      }
      else {
        newEntry = command
      }
    }
    // 解析原有内容为条目数组（对 fish 使用块解析）
    function parseEntries(content: string): string[] {
      if (historyFormat === 'fish') {
        const lines = content.split(/\r?\n/)
        const blocks: string[] = []
        let buffer: string[] = []
        for (const line of lines) {
          if (line.startsWith('- cmd: ')) {
            if (buffer.length) {
              blocks.push(buffer.join('\n'))
              buffer = []
            }
            buffer.push(line)
          }
          else if (buffer.length) {
            buffer.push(line)
          }
          else if (line.trim() !== '') {
            blocks.push(line)
          }
        }
        if (buffer.length)
          blocks.push(buffer.join('\n'))
        return blocks.filter(Boolean)
      }
      else if (historyFormat === 'zsh') {
        return content
          .split(/\r?\n/)
          .map(l => l.trim())
          .filter(Boolean)
      }
      else {
        // bash: 需要保留时间戳行和命令行的配对
        const lines = content.split(/\r?\n/)
        const entries: string[] = []
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          if (line.startsWith('#')) {
            const next = lines[i + 1] ?? ''
            entries.push(`${line}\n${next}`)
            i++
          }
          else if (line.trim() !== '') {
            entries.push(line)
          }
        }
        return entries
      }
    }

    const entries = parseEntries(raw)

    // 提取条目对应的“命令字符串”，用于去重比较
    function extractCommand(entry: string): string {
      if (historyFormat === 'fish') {
        const m = entry.split('\n')[0].match(/^- cmd: (.*)$/)
        return m ? m[1] : entry
      }
      else if (historyFormat === 'zsh') {
        const m = entry.match(/^[^;]*;(.+)$/)
        return m ? m[1] : entry
      }
      else {
        if (entry.startsWith('#')) {
          const parts = entry.split(/\r?\n/)
          return parts[1] ?? parts[0]
        }
        return entry
      }
    }

    // 构建新的条目数组，去掉已有相同 command 的旧条目
    const newEntries: string[] = []
    const newCmd = extractCommand(newEntry)
    let existingFishBlock: string | null = null
    for (const e of entries) {
      const cmd = extractCommand(e)
      if (cmd === newCmd) {
        // For fish, keep the whole existing block (to preserve metadata) and update its timestamp later
        if (historyFormat === 'fish') {
          existingFishBlock = e
          continue
        }
        // otherwise skip the duplicate
        continue
      }
      newEntries.push(e)
    }

    // 将 newEntry 推到末尾（保持最近记录在最后）
    if (historyFormat === 'fish' && existingFishBlock) {
      // update the 'when' line in the existing block to the new timestamp
      const lines = existingFishBlock.split('\n')
      let hasWhen = false
      const updated = lines.map((line) => {
        if (line.trim().startsWith('when:') || line.startsWith('  when:')) {
          hasWhen = true
          return `  when: ${timestamp}`
        }
        return line
      })
      if (!hasWhen) {
        // insert when after the cmd line
        updated.splice(1, 0, `  when: ${timestamp}`)
      }
      newEntries.push(updated.join('\n'))
    }
    else {
      newEntries.push(newEntry)
    }

    // 根据格式重组文件内容
    let finalContent = ''
    if (historyFormat === 'fish') {
      finalContent = `${newEntries.map(e => e.trimEnd()).join('\n')}\n`
    }
    else {
      finalContent = `${newEntries.join('\n')}\n`
    }

    // Use synchronous write to avoid async hanging with locked files
    // 原子写入：先写入临时文件，再重命名覆盖
    const tmpPath = `${historyFile}.ccommand.tmp`
    fs.writeFileSync(tmpPath, finalContent, 'utf8')
    fs.renameSync(tmpPath, historyFile)
  }
  catch (err) {
    log(
      colors.red(
        `${
          isZh
            ? `❌ 添加到 ${shellName} 历史记录失败`
            : `❌ Failed to add to ${shellName} history`
        }${err ? `: ${String(err)}` : ''}`,
      ),
    )
  }
}
