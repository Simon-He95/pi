import process from 'node:process'
import { isInstallPkg, jsShell } from 'lazy-js-utils/node'
import { version } from '../package.json'
import { installDeps } from './installDeps'

const isZh = process.env.PI_Lang === 'zh'

async function ensureGum() {
  if (await isInstallPkg('gum'))
    return true
  await installDeps({ gum: true, ni: false, strict: false })
  return await isInstallPkg('gum')
}

function printPlainVersion() {
  console.log(isZh ? `pi 版本: ${version}` : `pi version: ${version}`)
  console.log(isZh ? '请为我的努力点一个行 🌟' : 'Please give me a 🌟 for my efforts')
  console.log(isZh ? '谢谢 🤟' : 'Thank you 🤟')
}

function printPlainHelp() {
  console.log(
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
    ].join('\n'),
  )
}

export async function help(argv: any[]) {
  const arg = argv[0]
  if (arg === '-v' || arg === '--version') {
    const hasGum = await ensureGum()
    if (hasGum) {
      await jsShell(
        isZh
          ? `gum style \
      --foreground 212 --border-foreground 212 --border double \
      --align center --width 50 --margin "1 2" --padding "2 4" \
      "pi 版本: ${version}" "请为我的努力点一个行 🌟" "谢谢 🤟"`
          : `gum style \
    --foreground 212 --border-foreground 212 --border double \
    --align center --width 50 --margin "1 2" --padding "2 4" \
    "pi version: ${version}" "Please give me a 🌟 for my efforts" "Thank you 🤟"`,
        'inherit',
      )
    }
    else {
      printPlainVersion()
    }
    process.exit(0)
  }
  else if (arg === '-h' || arg === '--help') {
    const hasGum = await ensureGum()
    if (hasGum) {
      await jsShell(
        `gum style \
            --foreground 212 --border-foreground 212 --border double \
            --align left --width 50 --margin "1 2" --padding "1 1" \
            "PI Commands:" "~ pi: install package" "~ pix: npx package" "~ pui: uninstall package" "~ prun: run package script" "~ pinit: package init" "~ pbuild: go build | cargo build" "~ pfind: find monorepo of yarn or pnpm" "~ pa: agent alias" "~ pu: package upgrade" "~ pci: package clean install" "~ pil: package latest install"
      `,
        'inherit',
      )
    }
    else {
      printPlainHelp()
    }
    process.exit(0)
  }
}
