import { spaceFormat } from 'lazy-js-utils'
import { pi } from './pi'
import { getParams } from './utils'
// install @latest
export async function pil(params: string, pkg: string) {
  const latestPkgname = spaceFormat(params, '@latest ')
  let suffix = ''
  const reg = /(-[dDwW]+)/g
  ;(await getParams(latestPkgname)).replace(reg, (v, k) => {
    suffix += ` ${k}`
    return v.replace(k, '')
  })
  const command = pkg
    ? spaceFormat(`${pkg} `, '@latest ').trim() + suffix
    : `${suffix}`
  return pi(command, command)
}
