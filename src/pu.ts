import { jsShell } from 'lazy-js-utils/dist/node'
// package update
export function pu() {
  return jsShell('nu')
}
