import { jsShell } from 'lazy-js-utils/node'
// agent alias
export function pa(params = '') {
  return jsShell(`na${params ? ` ${params}` : ''}`, 'inherit')
}
