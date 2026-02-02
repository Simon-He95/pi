import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'

const entry = process.argv[1]
const base = entry
  ? path.resolve(entry)
  : path.join(process.cwd(), 'index.js')

export const localRequire = createRequire(base)
