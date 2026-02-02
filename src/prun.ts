import { localRequire } from './require'

// package run script
export function prun(params: string) {
  const { ccommand } = localRequire('ccommand')
  return ccommand(params)
}
