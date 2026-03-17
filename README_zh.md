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
- [Workspace 工具选择](#-workspace-工具选择)
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

### pil - 安装最新的依赖

![运行命令示例](/assets/prun.png)

### pui - 卸载依赖

![卸载依赖示例](/assets/pui.png)

### pci - 清理缓存

![清理缓存示例](/assets/pci.png)

### prun - 运行命令

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
  # 为当前 workspace 重新选择包管理器
  pi --choose-tool
  # 不弹交互，直接指定当前 workspace 使用的工具
  pi --choose-tool bun
  # 清除当前 workspace 已保存的包管理器选择
  pi --forget-tool
  # 查看当前 workspace 实际会使用哪个包管理器
  pi --show-tool
  # 以 JSON 查看当前 workspace 的工具状态
  pi --show-tool --json
  # 列出当前 workspace 检测到的所有候选工具
  pi --list-tools
  # 以 JSON 列出候选工具
  pi --list-tools --json
  # 卸载依赖
  pui xxx
  # 执行命令
  prun
  # 执行 workspace 中的 scripts
  # 执行 js | ts 文件或目录下的 index.js | index.ts
  # 执行 go 文件或目录下的 main.go
  # 执行 rust 文件或目录下的 main.rs
  # 执行 python 文件或目录下的 main.py
  pfind
  # 初始化
  pinit
  # 打包 - 针对cargo  go
  pbuild
```

## :triangular_ruler: Workspace 工具选择

当同一个 workspace 里同时存在多种包管理器标记时，例如 `bun.lock` 和 `pnpm-lock.yaml`，`pi`、`pil`、`pci` 会先让你选择一次当前 workspace 使用哪种工具，并把这个选择记住。

- 这个选择会保存在你本机的配置目录中，例如 `~/.config/pi/workspace-tools.json`。
- 这是本地机器配置，不应该提交到仓库中。
- 如果之前记住的工具对应的 lock 文件已经不存在了，PI 会忽略旧值，并自动清理失效记录。
- 使用 `pi --choose-tool` 或 `pil --choose-tool` 可以重新选择。
- 也可以用 `pi --choose-tool bun` 或 `pil --choose-tool pnpm` 直接指定工具，不走交互选择。
- 使用 `pi --forget-tool` 或 `pil --forget-tool` 可以清除已保存的选择。
- 使用 `pi --show-tool` 或 `pil --show-tool` 可以查看当前会使用的工具以及决策来源。
- 如果想给脚本消费，可以在 `--show-tool` 后加 `--json`。
- 使用 `pi --list-tools` 或 `pil --list-tools` 可以查看当前检测到的所有候选工具、根目录和 lockfile 标记。
- `pci --choose-tool` 和 `pci --forget-tool` 也遵循同样的行为。
- `pci --show-tool` 也遵循同样的行为。
- `pci --list-tools` 也遵循同样的行为。
- `pui`、`pio` 在解析包管理器时也会复用这份已保存的选择。

示例：

```bash
pi react --choose-tool
pi --choose-tool bun
pil --choose-tool
pil --choose-tool pnpm
pi --forget-tool
pil --forget-tool
pi --show-tool
pil --show-tool
pi --show-tool --json
pi --list-tools
pi --list-tools --json
pci --choose-tool
pci --forget-tool
pci --show-tool
pci --show-tool --json
pci --list-tools
```

## Shell 集成（prun）

```
# zsh
eval "$(prun --init zsh)"

# bash
eval "$(prun --init bash)"

# fish
eval (prun --init fish)

# Windows PowerShell
prun --init powershell | Out-String | Invoke-Expression

# PowerShell 7+
prun --init pwsh | Out-String | Invoke-Expression
```

> 说明：这样 `prun` / `pfind` 选择的命令会立即写入并刷新当前 shell 的历史记录（按 ↑ 可直接取回）。

自动集成（内置）：

- 交互式终端下首次执行 `prun` 会自动把对应配置写入 shell 配置文件（zsh: `~/.zshrc`, bash: `~/.bashrc`, fish: `~/.config/fish/config.fish`, PowerShell: `$PROFILE`）。
- 可通过 `PI_NO_AUTO_INIT=1` 禁用（或设置 `PI_AUTO_INIT=0`）。
- 写入后请重新打开终端（或手动 source / 重新加载对应配置）。

持久化（写入配置文件）：

```
# zsh
echo 'eval "$(prun --init zsh)"' >> ~/.zshrc

# bash
echo 'eval "$(prun --init bash)"' >> ~/.bashrc

# fish
echo 'prun --init fish | source' >> ~/.config/fish/config.fish

# Windows PowerShell
Add-Content -Path $PROFILE -Value 'prun --init powershell | Out-String | Invoke-Expression'

# PowerShell 7+
Add-Content -Path $PROFILE -Value 'prun --init pwsh | Out-String | Invoke-Expression'
```

写入后请重新加载配置文件，或打开一个新的终端窗口。

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
export PI_DEFAULT=pnpm # 当 PI 无法为当前 workspace 推断出更合适的工具时，作为兜底默认值
```

- 样式的种类 70+，来源于[cli-spinners](https://jsfiddle.net/sindresorhus/2eLtsbey/embedded/result/)，可自行选择将名字填入 PI_SPINNER 中。
- 颜色可选值：'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray', 填入 PI_COLOR 中

## :battery: 依赖

- [ora](https://github.com/sindresorhus/ora)
- [ccommand](https://github.com/Simon-He95/ccommand)
- [cargo](https://github.com/rust-lang/cargo)

## License

[MIT](./LICENSE) License © 2022 [Simon He](https://github.com/Simon-He95)

<a href="https://github.com/Simon-He95/sponsor" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" style="height: 51px !important;width: 217px !important;" ></a>
