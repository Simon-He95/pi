import { getPkg, jsShell } from 'lazy-js-utils'
import pc from 'picocolors'
import { pi } from './pi'
import { getParams } from './utils'
// install @latest
export async function pil(params: string) {
  // 提供当前所有依赖选择
  const { dependencies = {}, devDependencies = {} } = await getPkg()
  if (!params) {
    const deps = [
      ...Object.keys(dependencies).map(key => `${key}: ${dependencies[key]}`),
      ...Object.keys(devDependencies).map(
        key => `${key}: ${devDependencies[key]}`,
      ),
    ]
    const { result: choose, status } = jsShell(
      `echo ${deps.join(
        ',',
      )} | sed "s/,/\\n/g" | gum filter --no-limit --placeholder=" 🤔${
        process.env.PI_Lang === 'zh'
          ? '请选择一个需要获取最新版本的依赖'
          : 'Please select a dependency that needs to obtain the latest version.'
      }"`,
      'pipe',
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
      .map((i) => {
        const name = i.split(': ')[0]
        if (name in devDependencies)
          return `${name}@latest -D`
        return `${name}@latest`
      })
    params = names.join(' ')
  }
  let latestPkgname = params
  const reg = /\s(-[dDwW]+)/g
  const suffix: string[] = []
  let command = (latestPkgname = (await getParams(params)).replace(
    reg,
    (_, k) => {
      suffix.push(k)
      return ''
    },
  ))
  latestPkgname = latestPkgname
    .replaceAll('@latest', '')
    .split(' ')
    .map((i) => {
      const v = dependencies[i] || devDependencies[i]
      return `${i}$${v}`
    })
    .join(' ')
  command = command
    .replace(/\s+/, ' ')
    .split(' ')
    .map((i, index) => `${i} ${suffix[index] || '-s'}`)
    .join(' ')
  return await pi(command, latestPkgname.replaceAll('@latest', ''), 'pil')
}
