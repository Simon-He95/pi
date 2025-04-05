import type { Color, Spinner } from 'ora'
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
          return params.replace(w, ' -W')
        return params
      default:
        return params
    }
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (_) {
    console.log(
      colors.red(
        `${isZh
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
        : `Installed ${pName} ${colors.dim(v)} -> latest version：${result.match(/@(\S+)/)![1]
        }`
      data.push(item)
    }
    else {
      throw new Error(result)
    }
  }
  return `${data.join(' ')}${isZh ? ' 安装成功! 😊' : ' successfully! 😊'}`
}
