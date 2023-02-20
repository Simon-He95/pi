import path from 'path'
import { getPkg, getPkgTool, isFile, jsShell } from 'lazy-js-utils'
import ora from 'ora'
import type { Color, Spinner } from 'ora'

const DW = /-DW\s*$/
const W = /-W\s*$/
const Dw = /-Dw\s*$/
const w = /-w\s*$/
const D = /-D\s*$/
const d = /-d\s*$/

export async function getParams(params: string) {
  const root = process.cwd()
  switch (getPkgTool()) {
    case 'pnpm':
      if (!isFile(path.resolve(root, './pnpm-workspace.yaml'))) {
        if (DW.test(params))
          return params.replace(DW, '-D')
        if (Dw.test(params))
          return params.replace(Dw, '-D')
        if (W.test(params))
          return params.replace(W, '')
        if (w.test(params))
          return params.replace(w, '')
      }
      if (isFile('./pnpm-workspace.yaml')) {
        if (D.test(params))
          return params.replace(D, '-Dw')
        if (d.test(params))
          return params.replace(d, '-Dw')
        if (!params)
          return params
        return `${params} -w`
      }

      if (DW.test(params))
        return params.replace(DW, '-Dw')
      if (W.test(params))
        return params.replace(W, '-w')

      return params
    case 'yarn':
      if (!(await getPkg(path.resolve(root, './package.json')))?.workspaces) {
        if (Dw.test(params))
          return params.replace(Dw, '-D')
        if (DW.test(params))
          return params.replace(DW, '-D')
        if (W.test(params))
          return params.replace(W, '')
        if (w.test(params))
          return params.replace(w, '')
      }

      if ((await getPkg())?.workspaces) {
        if (D.test(params))
          return params.replace(D, '-DW')
        if (d.test(params))
          return params.replace(d, '-DW')
        if (!params)
          return params
        return `${params} -W`
      }

      if (Dw.test(params))
        return params.replace(Dw, '-DW')
      if (W.test(params))
        return params.replace(w, '-W')
      return params
    default:
      return params
  }
}

export async function loading(text: string) {
  const { color, spinner } = await getStyle()
  const result = ora({
    text,
    spinner,
    color,
    discardStdin: true,
  }).start()
  return result
}

export async function getStyle() {
  const { result: _color = 'yellow' } = await jsShell('echo $PI_COLOR', 'pipe')
  const color = _color as Color
  const { result: _spinner = 'star' } = await jsShell(
    'echo $PI_SPINNER',
    'pipe',
  )
  const spinner = _spinner as unknown as Spinner
  return { color, spinner }
}
