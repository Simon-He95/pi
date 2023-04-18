import { getPkgTool, jsShell } from 'lazy-js-utils'

// npx
export async function pix(params: string) {
  switch (await getPkgTool()) {
    case 'bun':
      return jsShell(`bunx ${params}`)
    default:
      return jsShell(`npx ${params}`)
  }
}
