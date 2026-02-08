import process from 'node:process'
import { version } from '../package.json'
import { renderBox } from './tty'

const isZh = process.env.PI_Lang === 'zh'

export async function help(argv: any[]) {
  const arg = argv[0]
  if (arg === '-v' || arg === '--version') {
    const message = isZh
      ? [`pi 版本: ${version}`, '请为我的努力点一个行 🌟', '谢谢 🤟']
      : [`pi version: ${version}`, 'Please give me a 🌟 for my efforts', 'Thank you 🤟']
    console.log(
      renderBox(message, {
        align: 'center',
        width: 50,
        marginX: 2,
        marginY: 1,
        paddingX: 4,
        paddingY: 2,
      }),
    )
    process.exit(0)
  }
  else if (arg === '-h' || arg === '--help') {
    console.log(
      renderBox(
        [
          'PI Commands:',
          '~ pi: install package',
          '~ pix: npx package',
          '~ pui: uninstall package',
          '~ prun: run package script',
          '~ pinit: package init',
          '~ pbuild: go build | cargo build',
          '~ pfind: find monorepo of yarn or pnpm',
          '~ pa: agent alias',
          '~ pu: package upgrade',
          '~ pci: package clean install',
          '~ pil: package latest install',
        ],
        {
          align: 'left',
          width: 50,
          marginX: 2,
          marginY: 1,
          paddingX: 1,
          paddingY: 1,
        },
      ),
    )
    process.exit(0)
  }
}
