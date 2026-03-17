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
          '~ pi --choose-tool: choose package manager for this workspace',
          '~ pi --choose-tool bun: choose the tool directly',
          '~ pi --forget-tool: clear saved package manager choice',
          '~ pi --show-tool: show current workspace package manager',
          '~ pi --show-tool --json: show current tool as JSON',
          '~ pi --list-tools: list detected package-manager candidates',
          '~ pi --list-tools --json: list candidates as JSON',
          '~ pix: npx package',
          '~ pui: uninstall package',
          '~ prun: run package script',
          '~ pinit: package init',
          '~ pbuild: go build | cargo build',
          '~ pfind: find monorepo of yarn or pnpm',
          '~ pa: agent alias',
          '~ pu: package upgrade',
          '~ pci: package clean install',
          '~ pci --choose-tool: re-pick tool before clean install',
          '~ pci --choose-tool bun: choose the tool directly',
          '~ pci --forget-tool: clear saved tool before clean install',
          '~ pci --show-tool: show current tool before clean install',
          '~ pci --show-tool --json: show current tool as JSON',
          '~ pci --list-tools: list detected candidates',
          '~ pci --list-tools --json: list candidates as JSON',
          '~ pil: package latest install',
          '~ pil --choose-tool: re-pick tool before latest install',
          '~ pil --choose-tool bun: choose the tool directly',
          '~ pil --forget-tool: clear saved tool before latest install',
          '~ pil --show-tool: show current tool before latest install',
          '~ pil --show-tool --json: show current tool as JSON',
          '~ pil --list-tools: list detected candidates',
          '~ pil --list-tools --json: list candidates as JSON',
        ],
        {
          align: 'left',
          width: 76,
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
