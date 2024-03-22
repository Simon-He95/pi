import { ccommand } from 'ccommand'
// workspace find script
export function pfind(params: string) {
  return ccommand(`find ${params}`)
}
