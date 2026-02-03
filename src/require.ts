import { createRequire } from 'node:module'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const base = fileURLToPath(import.meta.url)

export const localRequire = createRequire(base)

export function getCcommand() {
  if (process.env.CCOMMAND_NO_HISTORY == null)
    process.env.CCOMMAND_NO_HISTORY = '1'
  return localRequire('ccommand') as {
    ccommand: (params: string) => Promise<void> | void
  }
}
