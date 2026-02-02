import process from 'node:process'
import { isInstallPkg, jsShell } from 'lazy-js-utils/node'
import color from 'picocolors'

const isZh = process.env.PI_Lang === 'zh'
const gumDocUrl = 'https://github.com/charmbracelet/gum'
const niDocUrl = 'https://github.com/antfu/ni'

export interface InstallDepsOptions {
  gum?: boolean
  ni?: boolean
  strict?: boolean
}

// dependency
export async function installDeps(options: InstallDepsOptions = {}) {
  const { gum = true, ni = true, strict = true } = options
  const platform = process.platform

  if (gum && !(await isInstallPkg('gum'))) {
    if (platform === 'darwin') {
      console.log(
        color.cyan(
          isZh ? '正在为您安装必要的依赖gum...' : 'Installing gum...',
        ),
      )
      const { status } = await jsShell('brew install gum', [
        'inherit',
        'pipe',
        'inherit',
      ])
      if (status === 0) {
        console.log(
          color.cyan(isZh ? 'gum 安装成功!' : 'gum installed successfully!'),
        )
      }
      else {
        console.log(
          color.red(
            isZh
              ? `gum 安装失败，请尝试从官网解决安装问题! ${gumDocUrl}`
              : `gum installation failed, please try manual install: ${gumDocUrl}`,
          ),
        )
        if (strict)
          process.exit(1)
      }
    }
    else {
      console.log(
        color.yellow(
          isZh
            ? `未检测到 gum，请根据系统手动安装: ${gumDocUrl}`
            : `gum not found, please install it manually: ${gumDocUrl}`,
        ),
      )
    }
  }

  if (ni && !(await isInstallPkg('ni'))) {
    console.log(
      color.cyan(isZh ? '正在为您安装必要的依赖ni...' : 'Installing ni...'),
    )
    const { status } = await jsShell('npm i -g @antfu/ni', [
      'inherit',
      'pipe',
      'inherit',
    ])
    if (status === 0) {
      console.log(
        color.cyan(isZh ? 'ni 安装成功!' : 'ni installed successfully!'),
      )
    }
    else {
      console.log(
        color.red(
          isZh
            ? `ni 安装失败，请尝试从官网解决安装问题! ${niDocUrl}`
            : `ni installation failed, please try manual install: ${niDocUrl}`,
        ),
      )
      if (strict)
        process.exit(1)
    }
  }
}
