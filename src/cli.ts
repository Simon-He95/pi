import process from 'node:process'
import { setup } from './index'

setup().catch((error) => {
  console.error(error)
  process.exit(1)
})
