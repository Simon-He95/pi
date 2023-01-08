import { jsShell } from 'lazy-js-utils'
// package run script
export function prun(params: string) {
  return jsShell(`ccommand ${params}`)
}
