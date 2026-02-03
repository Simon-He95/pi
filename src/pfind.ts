import { getCcommand } from './require'

// workspace find script
export function pfind(params: string) {
  const { ccommand } = getCcommand()
  return ccommand(`find ${params}`)
}
