import process from 'node:process'
import { getPkg, jsShell } from 'lazy-js-utils/node'
import pc from 'picocolors'
import { pi } from './pi'
import { getParams } from './utils'
// install @latest
export async function pil(params: string) {
  // 提供当前所有依赖选择
  const { dependencies = {}, devDependencies = {} } = await getPkg()
  if (!params) {
    const deps = [
      ...Object.keys(dependencies).map(
        key => `${key}: ${dependencies[key].replace(/([><~])/g, '\\$1')}`,
      ),
      ...Object.keys(devDependencies).map(
        key => `${key}: ${devDependencies[key].replace(/([><~])/g, '\\$1')}`,
      ),
    ]
    const { result: choose, status } = await jsShell(
      `echo ${deps.join(
        ',',
      )} | sed "s/,/\\n/g" | gum filter --no-limit --placeholder=" 🤔${
        process.env.PI_Lang === 'zh'
          ? '请选择一个需要获取最新版本的依赖'
          : 'Please select a dependency that needs to obtain the latest version.'
      }"`,
      {
        stdio: ['inherit', 'pipe', 'inherit'],
      },
    )

    if (status === 130) {
      console.log(pc.dim('已取消'))
      process.exit(0)
    }
    else if (status !== 0) {
      throw new Error(choose)
    }
    const names = choose
      .trim()
      .split('\n')
      .map((i: any) => {
        const name = i.split(': ')[0]
        if (name in devDependencies)
          return `${name}@latest -D`
        return `${name}@latest -S`
      })
    params = names.join(' ')
  }
  let latestPkgname = params
  const reg = /\s(-[dws]+)/gi
  const suffix: string[] = []
  const command = (latestPkgname = (await getParams(params))!.replace(
    reg,
    (_, k) => {
      suffix.push(k)
      return ''
    },
  ))

  latestPkgname = latestPkgname
    .replace(/@latest/g, '')
    .split(' ')
    .filter(Boolean)
    .map((i) => {
      const v = dependencies[i] || devDependencies[i]
      return `${i}$${v}`
    })
    .join(' ')

  // 合并所有的 -S、-D、-DW、-W、-s、-d 等的结果
  // 规则：
  // - 每个包可有自己的标志（如 -D、-Dw、-DW），若缺失则为“普通依赖”（不追加任何标志）
  // - 若存在全局 workspace 标志（-w 或 -W），将其与每个包的标志合并：'' -> -w/-W，-D -> -Dw/-DW
  // - 忽略 -s/-S（仅作占位，不向真实命令透传）
  const tokens = command.replace(/\s+/, ' ').trim().split(' ').filter(Boolean)
  const pkgs = tokens.filter(t => !t.startsWith('-'))

  // 拆分后缀：识别全局 workspace 标志（-w/-W），其余按顺序分配给包
  let globalWorkspaceFlag: string | null = null
  const perFlags: Array<string | undefined> = []
  let assignIdx = 0
  for (const f of suffix) {
    if (/^-(?:w|W)$/.test(f)) {
      globalWorkspaceFlag = f
      continue
    }
    perFlags[assignIdx++] = f
  }

  const normalizeFlag = (f: string | undefined): string => {
    if (!f)
      return ''
    // 丢弃 -s/-S
    if (/^-s$/i.test(f) || /^-S$/.test(f))
      return ''
    return f
  }

  const combineWorkspace = (f: string, w: string | null): string => {
    if (!w)
      return f
    if (/w/i.test(f))
      return f
    if (!f)
      return w
    if (/d/i.test(f))
      return `-D${w.slice(1)}` // -D + w/W => -Dw 或 -DW
    return w
  }

  const finalFlags = pkgs.map((_, i) =>
    combineWorkspace(normalizeFlag(perFlags[i]), globalWorkspaceFlag),
  )

  // 分组聚合
  const group: Record<string, string[]> = {}
  pkgs.forEach((p, i) => {
    const key = finalFlags[i] || ''
    if (!group[key])
      group[key] = []
    group[key].push(p)
  })

  // 生成命令，空标志不透传
  const cmds = Object.entries(group).map(
    ([flag, list]) => `${list.join(' ')}${flag ? ` ${flag}` : ''}`,
  )

  return await pi(cmds, latestPkgname.replace(/@latest/g, ''), 'pil')
}
