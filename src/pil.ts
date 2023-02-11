import { spaceFormat } from 'lazy-js-utils'
import { pi } from './pi'
import { getParams } from './utils'
// install @latest
export async function pil(params: string, pkg: string) {
  const latestPkgname = spaceFormat(params, '@latest ')
  const newParams = await getParams(latestPkgname)

  return pi(newParams, pkg ? spaceFormat(`${pkg} `, '@latest ').trim() : '')
}
