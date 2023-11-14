import { getPkg, jsShell } from 'lazy-js-utils'
import pc from 'picocolors'
import { pi } from './pi'
import { getParams } from './utils'
// install @latest
export async function pil(params: string) {
  if (!params) {
    // 提供当前所有依赖选择
    const { dependencies, devDependencies } = await getPkg()

    const deps = [
      ...Object.keys(dependencies).map(key => `${key}: ${dependencies[key]}`),
      ...Object.keys(devDependencies).map(
        key => `${key}: ${devDependencies[key]}`,
      ),
    ]
    const { result: choose, status } = jsShell(
      `echo ${deps.join(
        ',',
      )} | sed "s/,/\\n/g" | gum filter --placeholder=" 🤔${
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
    const name = choose.split(': ')[0]
    if (name in devDependencies)
      params = `${name} -D`
    else params = name
  }
  let latestPkgname = addLatest(params)
  let suffix = ''
  const reg = /\s(-[dDwW]+)/g
  latestPkgname = (await getParams(latestPkgname)).replace(reg, (_, k) => {
    suffix += ` ${k}`
    return ''
  })
  const command = `${latestPkgname}${suffix}`
  return await pi(command, command, 'pil')
}

function addLatest(params: string) {
  return params
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((item) => {
      if (item[0] === '-')
        return item
      return `${item}@latest`
    })
    .join(' ')
}
