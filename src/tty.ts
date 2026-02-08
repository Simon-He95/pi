import process from 'node:process'
import readline from 'node:readline'
import pc from 'picocolors'

const isZh = process.env.PI_Lang === 'zh'

export function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY)
}

type SelectMode = 'single' | 'multiple'

interface SelectConfig {
  placeholder: string
  mode: SelectMode
}

function stripAnsi(input: string) {
  let output = ''
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (ch === '\u001B' && input[i + 1] === '[') {
      let j = i + 2
      while (j < input.length && /[0-9;]/.test(input[j]))
        j++
      if (input[j] === 'm') {
        i = j
        continue
      }
    }
    output += ch
  }
  return output
}

function charWidth(ch: string) {
  const code = ch.codePointAt(0) ?? 0
  return code >= 0x1100 ? 2 : 1
}

function stringWidth(input: string) {
  const clean = stripAnsi(input)
  let width = 0
  for (const ch of clean)
    width += charWidth(ch)
  return width
}

function rowCount(input: string, columns: number) {
  const width = stringWidth(input)
  return Math.max(1, Math.ceil(width / columns))
}

function fuzzyScore(option: string, query: string) {
  const optionLower = option.toLowerCase()
  const queryLower = query.toLowerCase()
  let score = 0
  let lastIndex = -1
  for (const ch of queryLower) {
    const idx = optionLower.indexOf(ch, lastIndex + 1)
    if (idx === -1)
      return null
    score += idx === lastIndex + 1 ? 5 : 1
    score -= idx
    lastIndex = idx
  }
  return score
}

function getMatchIndices(option: string, query: string) {
  if (!query)
    return []
  const optionLower = option.toLowerCase()
  const queryLower = query.toLowerCase()
  const indices: number[] = []
  let lastIndex = -1
  for (const ch of queryLower) {
    const idx = optionLower.indexOf(ch, lastIndex + 1)
    if (idx === -1)
      return []
    indices.push(idx)
    lastIndex = idx
  }
  return indices
}

function highlightMatch(option: string, query: string, active: boolean) {
  if (!query)
    return active ? pc.cyan(option) : option
  const matchSet = new Set(getMatchIndices(option, query))
  let output = ''
  for (let i = 0; i < option.length; i++) {
    const ch = option[i]
    if (matchSet.has(i))
      output += pc.bold(pc.yellow(ch))
    else
      output += active ? pc.cyan(ch) : ch
  }
  return output
}

function filterOptions(options: string[], query: string) {
  if (!query)
    return options
  const ranked = options
    .map((option, index) => {
      const score = fuzzyScore(option, query)
      return score === null ? null : { option, score, index }
    })
    .filter(Boolean) as Array<{ option: string, score: number, index: number }>
  ranked.sort((a, b) => {
    if (b.score !== a.score)
      return b.score - a.score
    return a.index - b.index
  })
  return ranked.map(item => item.option)
}

function getVisibleWindow(total: number, cursor: number, limit: number) {
  if (total <= limit)
    return { start: 0, end: total }
  const half = Math.floor(limit / 2)
  let start = cursor - half
  let end = start + limit
  if (start < 0) {
    start = 0
    end = limit
  }
  if (end > total) {
    end = total
    start = Math.max(0, end - limit)
  }
  return { start, end }
}

async function runSelect(options: string[], config: SelectConfig) {
  if (!isInteractive())
    return null
  if (options.length === 0)
    return null

  const stdin = process.stdin
  const stdout = process.stdout
  // Speed up ESC handling; default timeout makes ESC feel laggy.
  readline.emitKeypressEvents(stdin, { escapeCodeTimeout: 50 } as any)
  if (stdin.isTTY)
    stdin.setRawMode(true)

  let query = ''
  let inputCursor = 0
  let filtered = options
  let cursor = 0
  const selected = new Set<string>()
  let searchMode = false
  let anchorSet = false

  let columns = stdout.columns || 80
  let rows = stdout.rows || 24
  let maxVisible = Math.max(5, rows - 4)

  const updateDimensions = () => {
    columns = stdout.columns || 80
    rows = stdout.rows || 24
    maxVisible = Math.max(5, rows - 4)
  }

  const updateFiltered = () => {
    filtered = filterOptions(options, query)
    if (filtered.length === 0)
      cursor = 0
    else if (cursor >= filtered.length)
      cursor = filtered.length - 1
  }

  const render = () => {
    updateFiltered()
    if (query.length > 0)
      searchMode = true
    const prompt = searchMode ? '/ ' : '> '
    const header = `? ${config.placeholder}`
    const inputLine = `${prompt}${query}`
    const hint = config.mode === 'multiple'
      ? (isZh
          ? '↑/↓ 选择，空格标记，Tab 补全，/ 搜索，回车确认，Esc 取消'
          : 'Use ↑/↓ to move, Space to toggle, Tab to complete, / to search, Enter to confirm, Esc to cancel')
      : (isZh
          ? '↑/↓ 选择，Tab 补全，/ 搜索，回车确认，Esc 取消'
          : 'Use ↑/↓ to move, Tab to complete, / to search, Enter to confirm, Esc to cancel')
    const lines: string[] = [header, inputLine]

    if (filtered.length === 0) {
      lines.push(pc.dim(isZh ? '没有匹配项' : 'No matches'))
    }
    else {
      const window = getVisibleWindow(filtered.length, cursor, maxVisible)
      const visible = filtered.slice(window.start, window.end)
      if (window.start > 0)
        lines.push(pc.dim('…'))
      visible.forEach((option, index) => {
        const actualIndex = window.start + index
        const active = actualIndex === cursor
        const picked = selected.has(option)
        const prefix = config.mode === 'multiple'
          ? picked
            ? '[x] '
            : '[ ] '
          : ''
        const indicator = active ? '>' : ' '
        const renderedOption = highlightMatch(option, query, active)
        const renderedPrefix = active ? pc.cyan(prefix) : prefix
        const renderedIndicator = active ? pc.cyan(indicator) : indicator
        const content = `${renderedIndicator} ${renderedPrefix}${renderedOption}`
        lines.push(content)
      })
      if (window.end < filtered.length)
        lines.push(pc.dim('…'))
    }
    lines.push(pc.dim(`${hint} (${Math.min(cursor + 1, filtered.length)}/${filtered.length})`))

    if (!anchorSet) {
      readline.cursorTo(stdout, 0)
      stdout.write('\x1B[s')
      anchorSet = true
    }
    else {
      stdout.write('\x1B[u')
      readline.cursorTo(stdout, 0)
      readline.clearScreenDown(stdout)
    }

    stdout.write(lines.join('\n'))
    const headerRows = rowCount(header, columns)
    const inputRowOffset = Math.floor((prompt.length + inputCursor) / columns)
    const inputCol = (prompt.length + inputCursor) % columns
    const targetRowOffset = headerRows + inputRowOffset
    stdout.write('\x1B[u')
    readline.moveCursor(stdout, 0, targetRowOffset)
    readline.cursorTo(stdout, inputCol)
  }

  return new Promise<string | string[] | null>((resolve) => {
    let onKeypress: (input: string, key: readline.Key) => void
    let onResize: () => void

    const done = (value: string | string[] | null) => {
      if (stdin.isTTY)
        stdin.setRawMode(false)
      stdin.off('keypress', onKeypress)
      process.off('SIGWINCH', onResize)
      stdout.write('\x1B[?25h')
      if (anchorSet) {
        stdout.write('\x1B[u')
        readline.cursorTo(stdout, 0)
        readline.clearScreenDown(stdout)
        anchorSet = false
      }
      stdout.write('\n')
      resolve(value)
    }

    const confirmSelection = () => {
      if (filtered.length === 0)
        return done(null)
      if (config.mode === 'multiple') {
        const picked = options.filter(option => selected.has(option))
        if (picked.length > 0)
          return done(picked)
        return done([filtered[cursor]])
      }
      return done(filtered[cursor])
    }

    const cancelSelection = () => done(null)

    onKeypress = (input: string, key: readline.Key) => {
      if (key?.ctrl && key.name === 'c')
        return cancelSelection()
      if (key?.name === 'escape') {
        if (query.length > 0) {
          query = ''
          inputCursor = 0
          return render()
        }
        return cancelSelection()
      }
      if (key?.name === 'return')
        return confirmSelection()
      if (key?.name === 'up') {
        if (filtered.length > 0)
          cursor = (cursor - 1 + filtered.length) % filtered.length
        return render()
      }
      if (key?.name === 'down') {
        if (filtered.length > 0)
          cursor = (cursor + 1) % filtered.length
        return render()
      }
      if (config.mode === 'multiple' && key?.name === 'space') {
        const option = filtered[cursor]
        if (option) {
          if (selected.has(option))
            selected.delete(option)
          else
            selected.add(option)
        }
        return render()
      }
      if (key?.name === 'tab') {
        if (filtered.length > 0) {
          query = filtered[cursor] || filtered[0]
          inputCursor = query.length
          searchMode = true
          return render()
        }
        return
      }
      if (input === '/' && !key?.ctrl && !key?.meta) {
        if (!searchMode) {
          searchMode = true
          query = ''
          inputCursor = 0
          return render()
        }
        if (searchMode && query.length === 0) {
          searchMode = false
          return render()
        }
      }
      if (key?.name === 'left') {
        if (inputCursor > 0)
          inputCursor -= 1
        return render()
      }
      if (key?.name === 'right') {
        if (inputCursor < query.length)
          inputCursor += 1
        return render()
      }
      if (key?.name === 'home' || (key?.ctrl && key?.name === 'a')) {
        inputCursor = 0
        return render()
      }
      if (key?.name === 'end' || (key?.ctrl && key?.name === 'e')) {
        inputCursor = query.length
        return render()
      }
      if (key?.name === 'backspace') {
        if (query) {
          query
            = query.slice(0, Math.max(0, inputCursor - 1))
              + query.slice(inputCursor)
          inputCursor = Math.max(0, inputCursor - 1)
          return render()
        }
        return
      }
      if (key?.name === 'delete') {
        if (query && inputCursor < query.length) {
          query = query.slice(0, inputCursor) + query.slice(inputCursor + 1)
          return render()
        }
        return
      }
      if (key?.ctrl && key?.name === 'u') {
        query = ''
        inputCursor = 0
        return render()
      }
      if (input && !key?.ctrl && !key?.meta && input.length === 1) {
        if (config.mode !== 'multiple' || input !== ' ') {
          query
            = query.slice(0, inputCursor) + input + query.slice(inputCursor)
          inputCursor += input.length
          searchMode = true
        }
        return render()
      }
    }

    onResize = () => {
      updateDimensions()
      if (anchorSet) {
        stdout.write('\x1B[u')
        readline.cursorTo(stdout, 0)
        stdout.write('\x1B[s')
      }
      render()
    }

    process.on('SIGWINCH', onResize)
    stdin.on('keypress', onKeypress)
    render()
  })
}

export async function ttySelect(options: string[], placeholder: string) {
  const result = await runSelect(options, {
    placeholder,
    mode: 'single',
  })
  return typeof result === 'string' ? result : null
}

export async function ttyMultiSelect(options: string[], placeholder: string) {
  const result = await runSelect(options, {
    placeholder,
    mode: 'multiple',
  })
  return Array.isArray(result) ? result : null
}

export function renderBox(
  lines: string[],
  options: {
    width?: number
    align?: 'left' | 'center'
    paddingX?: number
    paddingY?: number
    marginX?: number
    marginY?: number
  } = {},
) {
  const width = options.width ?? Math.max(...lines.map(line => line.length), 0)
  const paddingX = options.paddingX ?? 2
  const paddingY = options.paddingY ?? 1
  const marginX = options.marginX ?? 0
  const marginY = options.marginY ?? 0
  const align = options.align ?? 'left'
  const innerWidth = width + paddingX * 2
  const margin = ' '.repeat(marginX)
  const top = `${margin}+${'-'.repeat(innerWidth)}+`
  const bottom = top
  const emptyLine = `${margin}|${' '.repeat(innerWidth)}|`

  const alignedLines = lines.map((line) => {
    const space = Math.max(0, width - line.length)
    const leftPad = align === 'center' ? Math.floor(space / 2) : 0
    const rightPad = space - leftPad
    return `${margin}|${' '.repeat(paddingX + leftPad)}${line}${' '.repeat(paddingX + rightPad)}|`
  })

  const output: string[] = []
  for (let i = 0; i < marginY; i++)
    output.push('')
  output.push(top)
  for (let i = 0; i < paddingY; i++)
    output.push(emptyLine)
  output.push(...alignedLines)
  for (let i = 0; i < paddingY; i++)
    output.push(emptyLine)
  output.push(bottom)
  for (let i = 0; i < marginY; i++)
    output.push('')
  return output.join('\n')
}
