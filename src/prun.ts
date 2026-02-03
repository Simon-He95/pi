import { getCcommand } from './require'

// package run script
export function prun(params: string) {
  const { ccommand } = getCcommand()
  return ccommand(params)
}
