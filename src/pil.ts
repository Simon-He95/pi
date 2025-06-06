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
      ...Object.keys(dependencies).map(key => `${key}: ${dependencies[key].replace(/([><~])/g, '\\$1')}`),
      ...Object.keys(devDependencies).map(
        key => `${key}: ${devDependencies[key].replace(/([><~])/g, '\\$1')}`,
      ),
    ]
    const { result: choose, status } = await jsShell(
      `echo ${deps.join(
        ',',
      )} | sed "s/,/\\n/g" | gum filter --no-limit --placeholder=" 🤔${process.env.PI_Lang === 'zh'
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
  const group: Record<string, string[]> = {}
  const items = command
    .replace(/\s+/, ' ')
    .trim()
    .split(' ')
    .map((i, idx) => [i, suffix[idx] || '-s'])

  for (const [pkg, flag] of items) {
    if (!group[flag])
      group[flag] = []
    group[flag].push(pkg)
  }

  const cmds = Object.entries(group)
    .map(([flag, pkgs]) => `${pkgs.join(' ')} ${flag}`)

  return await pi(cmds, latestPkgname.replace(/@latest/g, ''), 'pil')
}
