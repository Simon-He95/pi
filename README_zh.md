<p align="center">
  <img src="/assets/kv.png" alt="PI - Smart Package Manager">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@simon_he/pi"><img src="https://img.shields.io/npm/v/@simon_he/pi?color=3fb883&amp;label=" alt="NPM version"></a>
  <a href="https://www.npmjs.com/package/@simon_he/pi"><img src="https://img.shields.io/npm/dm/@simon_he/pi.svg?color=3fb883&label=" alt="NPM Downloads"></a>
  <a href="https://github.com/Simon-He95/pi/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Simon-He95/pi?color=3fb883" alt="License"></a>
</p>

<p align="center"><a href="./README.md">English</a> | 简体中文</p>

## 📖 目录

- [简介](#-pi)
- [功能特点](#-聪明的包管理器)
- [示例展示](#-示例)
- [语言设置](#-语言)
- [安装方法](#-安装)
- [使用方法](#-使用)
- [支持的功能](#-功能)
- [特色功能](#-feature)
- [自定义配置](#-自定义配置)
- [依赖项](#-依赖)
- [许可证](#license)

## 🍭 PI

PI 是一个智能包管理工具，具有美观的自定义 loading 样式，让你在安装依赖时获得更好的视觉体验。它能够智能识别项目环境、模糊匹配命令，以及查找深层级的指令，大大提高了命令执行效率。

## 🚀 聪明的包管理器

PI 支持多种环境的包管理：

- ✅ **Go**: 支持 go mod 的依赖安装、卸载、执行和打包
- ✅ **Rust**: 支持 Cargo 的依赖安装、卸载、执行和打包
- ✅ **Node.js**: 支持 npm、pnpm、yarn 的依赖安装、卸载和执行
- ✅ **Python**: 支持 Python 文件的执行
- ✅ **Monorepo**: 自动识别并处理 yarn 和 pnpm 工作区的差异，修复 monorepo 安装问题

## 📷 示例

### pi - 安装依赖

![安装依赖示例](/assets/pi.png)

![安装依赖动画](/assets/pi.gif)

### pui - 卸载依赖

![卸载依赖示例](/assets/pui.png)

### pci - 清理缓存

![清理缓存示例](/assets/pci.png)

### prun - 运行命令

![运行命令示例](/assets/prun.png)

![运行命令动画](/assets/prun.gif)

### pfind - 查找命令

![查找命令动画](/assets/pfind.gif)

### 其他功能

![其他功能动画](/assets/others.gif)

## 📱 语言

```bash
# 在你的 bash 或 zsh 配置文件中设置环境变量

# 中文
export PI_Lang=zh

# 英文
export PI_Lang=en
```

## :gear: 安装

```
  npm i -g @simon_he/pi
```

## :open_hands: 使用

```
  # 根据当前目录的环境去分析使用哪种包管理器，go、rust、pnpm、yarn、npm
  # 安装依赖
  pi xxx
  # 卸载依赖
  pui xxx
  # 执行命令
  prun
  # 执行workspace中的scripts
  pfind
  # 初始化
  pinit
  # 打包 - 针对cargo  go
  pbuild
```

## 功能

当前环境是 npm | yarn | pnpm, 并且是支持传一些 args 的 --silent

- prun dev 当前 package.json 中的 dev 命令
- prun 如果不指定命令，提供当前 package 下所有 scripts 命令选择
- prun playground, 提供当前 package 下所有 scripts 命令选择

当前环境是 go

- prun message，会先找 message.go，如果没有找到，会找 message/main.go 来执行

当前环境是 rust

- prun 可执行 cargo run

workspace of pnpm ｜ yarn

- pfind 选择当前 workspace 下的包，然后选择对应的命令

## :monocle_face: Feature

```
<-- Go -->
 ## 直接输入目录名即可执行
 prun  # 默认执行当前目录下的main.go
 prun table # 如果table.go存在, 则执行table.go, 否则会执行table/main.go. table可以在任意的目录下。例如examples/table/main.go, 也会被找到并执行
<-- Go -->
```

## :bulb: 自定义配置

可以在.zshrc 配置 loading 样式，如下：

```
export PI_COLOR=red # loading样式颜色
export PI_SPINNER=star # loading样式
export PI_DEFAULT=pnpm # 如果当前项目并没有设置安装的包管理器可以在这里设置默认的安装
```

- 样式的种类 70+，来源于[cli-spinners](https://jsfiddle.net/sindresorhus/2eLtsbey/embedded/result/)，可自行选择将名字填入 PI_SPINNER 中。
- 颜色可选值：'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray', 填入 PI_COLOR 中

## :battery: 依赖

- [@antfu/ni](https://github.com/antfu/ni)
- [ora](https://github.com/sindresorhus/ora)
- [ccommand](https://github.com/Simon-He95/ccommand)
- [cargo](https://github.com/rust-lang/cargo)

## License

[MIT](./LICENSE) License © 2022 [Simon He](https://github.com/Simon-He95)

<a href="https://github.com/Simon-He95/sponsor" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" style="height: 51px !important;width: 217px !important;" ></a>
