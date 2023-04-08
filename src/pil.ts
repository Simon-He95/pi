import { pi } from './pi'
import { getParams } from './utils'
// install @latest
export async function pil(params: string) {
  let latestPkgname = addLatest(params)
  let suffix = ''
  const reg = /\s(-[dDwW]+)/g
  latestPkgname = (await getParams(latestPkgname)).replace(reg, (_, k) => {
    suffix += ` ${k}`
    return ''
  })
  const command = `${latestPkgname}${suffix}`
  return pi(command, command, 'pil')
}

function addLatest(params: string) {
  return params
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((item) => {
      if (item[0] === '-')
        return item
      return `${item}@latest`
    })
    .join(' ')
}
