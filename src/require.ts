import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const base = fileURLToPath(import.meta.url)

export const localRequire = createRequire(base)
