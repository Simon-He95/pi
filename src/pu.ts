import { jsShell } from 'lazy-js-utils/node'
// package update
export function pu() {
  return jsShell('nu')
}
