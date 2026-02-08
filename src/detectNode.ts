import process from 'node:process'
import { getPkg } from 'lazy-js-utils/node'
import colors from 'picocolors'

export async function detectNode() {
  try {
    await getPkg()
  }
  catch {
    const cwd = process.cwd()
    console.log(colors.red(`当前目录: ${cwd} 没有package.json文件`))
    process.exit(1)
  }
}
