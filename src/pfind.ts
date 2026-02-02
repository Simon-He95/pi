import { localRequire } from './require'

// workspace find script
export function pfind(params: string) {
  const { ccommand } = localRequire('ccommand')
  return ccommand(`find ${params}`)
}
