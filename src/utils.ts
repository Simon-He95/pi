import path from 'path'
import { getPkg, getPkgTool, isFile, jsShell } from 'lazy-js-utils'
import ora from 'ora'
import colors from 'picocolors'
import type { Color, Spinner } from 'ora'

const DW = /\s-DW/
const W = /\s-W/
const Dw = /\s-Dw/
const w = /\s-w/
const D = /\s-D(?!w)/
const d = /\s-d(?!w)/
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
  catch (err) {
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

export async function loading(text: string) {
  const { color, spinner } = await getStyle()
  return ora({
    text,
    spinner,
    color,
    discardStdin: true,
  }).start()
}

export async function getStyle() {
  const { PI_COLOR: color = 'yellow', PI_SPINNER: spinner = 'star' }
    = process.env
  return {
    color,
    spinner,
  } as unknown as { color: Color; spinner: Spinner }
}

export function getLatestVersion(pkg: string, isZh = true) {
  const data: string[] = []

  for (const p of pkg.replace(/\s+/, ' ').split(' ')) {
    const { status, result } = jsShell(`npm view ${p}`, 'pipe')
    if (status === 0) {
      const item = isZh
        ? `${p} 最新版本：${result.match(/@([^\s]+)/)![1]}`
        : `Installed ${pkg} latest version：${result.match(/@([^\s]+)/)![1]}`
      data.push(item)
    }
    else {
      throw new Error(result)
    }
  }
  return `${data.join(' ')}${isZh ? ' 安装成功! 😊' : 'successfully! 😊'}`
}
