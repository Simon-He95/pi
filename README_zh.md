<span ><p align="center">![kv](/assets/kv.png)</p></span>

<p align="center"><a href="https://www.npmjs.com/package/@simon_he/pi"><img src="https://img.shields.io/npm/v/@simon_he/pi?color=3fb883&amp;label=" alt="NPM version"></a></p>
<p align="center"><a href="./README.md">English</a> | 简体中文</p>

## :lollipop: PI

一个带有自定义 loading 样式的 smart 包管理器，让你安装依赖时更加美观:), 并且能够模糊匹配和查找深层级的指令

## :rocket: 聪明的包管理器

- 支持 go mod 的依赖安装、卸载、执行和打包
- 支持 Cargo 的依赖安装、卸载、执行和打包
- 支持 npm 的依赖安装、卸载和执行
- 支持 pnpm 的依赖安装、卸载和执行
- 支持 yarn 的依赖安装、卸载和执行
- 自动根据当前目录和环境去处理 yarn 和 pnpm w 和 W 的差异并会修复 monorepo 安装

## 例子

- pi
  ![img](/assets/pi.png)

  ![gif](/assets/pi.gif)

- pui
  ![img](/assets/pui.png)

- pci
  ![img](/assets/pci.png)

- prun
  ![img](/assets/prun.png)

  ![gif](/assets/prun.gif)

- pfind
  ![gif](/assets/pfind.gif)

- others
  ![gif](/assets/others.gif)

## :phone: Language

```
# 导出环境变量在你的bash或者zsh中

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
