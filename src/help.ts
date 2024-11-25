import { jsShell } from 'lazy-js-utils/dist/node'
import { version } from '../package.json'

const isZh = process.env.PI_Lang === 'zh'

export function help(argv: any[]) {
  const arg = argv[0]
  if (arg === '-v' || arg === '--version') {
    jsShell(
      isZh
        ? `gum style \
      --foreground 212 --border-foreground 212 --border double \
      --align center --width 50 --margin "1 2" --padding "2 4" \
      "pi 版本: ${version}" "请为我的努力点一个行 🌟" "谢谢 🤟"`
        : `gum style \
    --foreground 212 --border-foreground 212 --border double \
    --align center --width 50 --margin "1 2" --padding "2 4" \
    "pi version: ${version}" "Please give me a 🌟 for my efforts" "Thank you 🤟"`,
    )
    process.exit(0)
  }
  else if (arg === '-h' || arg === '--help') {
    jsShell(
      `gum style \
            --foreground 212 --border-foreground 212 --border double \
            --align left --width 50 --margin "1 2" --padding "1 1" \
            "PI Commands:" "~ pi: install package" "~ pix: npx package" "~ pui: uninstall package" "~ prun: run package script" "~ pinit: package init" "~ pbuild: go build | cargo build" "~ pfind: find monorepo of yarn or pnpm" "~ pa: agent alias" "~ pu: package upgrade" "~ pci: package clean install" "~ pil: package latest install"
      `,
    )
    process.exit(0)
  }
}
