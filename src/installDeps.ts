import { isInstallPkg, jsShell } from 'lazy-js-utils'
import color from 'picocolors'

// dependency
export async function installDeps() {
  if (!isInstallPkg('gum')) {
    console.log(color.cyan('正在为您安装必要的依赖gum...'))
    await jsShell('brew install gum', 'pipe')
    console.log(color.cyan('gum 安装成功!'))
  }
  if (!isInstallPkg('ni')) {
    console.log(color.cyan('正在为您安装必要的依赖ni...'))
    await jsShell('npm i -g @antfu/ni', 'pipe')
    console.log(color.cyan('ni 安装成功!'))
  }
}
