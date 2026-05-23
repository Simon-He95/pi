import { jsShell } from 'lazy-js-utils/node'
// package update
export function pu(params = '') {
  return jsShell(`nu${params ? ` ${params}` : ''}`, 'inherit')
}
