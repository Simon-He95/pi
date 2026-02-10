import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const base = fileURLToPath(import.meta.url)

export const localRequire = createRequire(base)

export function getCcommand() {
  return localRequire('ccommand') as {
    ccommand: (params: string) => Promise<void> | void
  }
}
