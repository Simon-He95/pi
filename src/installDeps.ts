import { isInstallPkg, jsShell } from 'lazy-js-utils'
import color from 'picocolors'

// dependency
export async function installDeps() {
  if (!isInstallPkg('gum')) {
    console.log(color.cyan('正在为您安装必要的依赖gum...'))
    const { status } = await jsShell('brew install gum', 'pipe')
    if (status === 0) {
      console.log(color.cyan('gum 安装成功!'))
    }
    else {
      console.log(
        color.red(
          'gum 安装失败，请尝试从官网解决安装问题! https://github.com/charmbracelet/gum',
        ),
      )
      process.exit(1)
    }
  }
  if (!isInstallPkg('ni')) {
    console.log(color.cyan('正在为您安装必要的依赖ni...'))
    const { status } = await jsShell('npm i -g @antfu/ni', 'pipe')
    if (status === 0) {
      console.log(color.cyan('ni 安装成功!'))
    }
    else {
      console.log(
        color.red(
          'ni 安装失败，请尝试从官网解决安装问题! https://github.com/antfu/ni',
        ),
      )
      process.exit(1)
    }
  }
}
