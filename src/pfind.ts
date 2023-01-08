import { jsShell } from 'lazy-js-utils'
// workspace find script
export function pfind(params: string) {
  return jsShell(`ccommand find ${params}`)
}
