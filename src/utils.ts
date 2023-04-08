import path from 'path'
import { getPkg, getPkgTool, isFile } from 'lazy-js-utils'
import ora from 'ora'
import colors from 'picocolors'
import type { Color, Spinner } from 'ora'

const DW = /\s-DW/
const W = /\s-W/
const Dw = /\s-Dw/
const w = /\s-w/
const D = /\s-D(?!w)/
const d = /\s-d(?!w)/

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
      colors.red(`package.json has not been found in ${process.cwd()}`),
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
