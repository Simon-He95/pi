import { spaceFormat } from 'lazy-js-utils'
import { pi } from './pi'
// install @latest
export function pil(params: string, pkg: string) {
  const latestPkgname = spaceFormat(params, '@latest ')
  return pi(latestPkgname, pkg ? spaceFormat(`${pkg} `, '@latest ').trim() : '')
}
