<p align="center">
  <img src="https://raw.githubusercontent.com/Simon-He95/pi/main/assets/kv.png" alt="PI - Project-aware command router">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@simon_he/pi"><img src="https://img.shields.io/npm/v/@simon_he/pi?color=3fb883&amp;label=" alt="NPM version"></a>
  <a href="https://www.npmjs.com/package/@simon_he/pi"><img src="https://img.shields.io/npm/dm/@simon_he/pi.svg?color=3fb883&label=" alt="NPM Downloads"></a>
  <a href="https://github.com/Simon-He95/pi/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Simon-He95/pi?color=3fb883" alt="License"></a>
</p>

<p align="center"><a href="./README.md">English</a> | 简体中文</p>

# PI

> 面向项目上下文的命令路由器：自动选择包管理器，运行脚本，处理 monorepo，并执行 Go/Rust/Python 任务。

PI 会识别当前项目环境，然后为 npm、pnpm、yarn、bun、Go、Rust 和 Python 工作流运行正确的命令。

> 需要 Node.js >= 22。CI 覆盖 Node.js 22 和 24。

```bash
npm i -g @simon_he/pi

pi react          # 使用当前项目的包管理器安装依赖
prun dev          # 运行或模糊选择 package scripts
pfind build       # 在 workspace 中查找并运行 scripts
```

## 为什么需要

不同项目会使用不同的包管理器、lockfile、workspace 和 scripts 布局。PI 提供一层统一命令入口，在执行前先理解当前项目。

- 自动识别 npm、pnpm、yarn、bun
- 为每个 workspace 记住包管理器选择
- 模糊运行 package scripts
- 在 monorepo 深层查找 scripts
- 运行 Go、Rust 和 Python 入口文件
- 将 `prun` / `pfind` 选择的命令集成到 shell 历史记录

## 核心命令

```bash
pi react
pi --choose-tool bun
pi --show-tool

prun dev
prun

pfind build
pfind
```

| 命令 | 用途 |
| --- | --- |
| `pi` | 使用当前项目的包管理器安装或更新依赖。 |
| `prun` | 运行 package scripts、模糊选择 scripts，或执行语言入口文件。 |
| `pfind` | 在 workspace / monorepo 中查找并运行 scripts。 |

## 命名说明

当前包仍发布为 `@simon_he/pi`，`pi` 仍是主命令。
但项目定位已经不只是安装依赖，而是面向项目上下文的命令路由器。

## 和 ni 对比

[`ni`](https://github.com/antfu-collective/ni) 的核心是为 JavaScript 项目使用正确的包管理器。

PI 更偏向项目命令路由器：

- 记住有歧义的 workspace 包管理器选择
- 通过 `prun` 支持 scripts 模糊选择
- 通过 `pfind` 在 monorepo 中搜索 scripts
- 支持 Go 和 Rust 的 build/run 工作流
- 支持 Python 文件执行
- 提供可选的 shell 历史集成

## 支持的项目

| 环境 | 支持 |
| --- | --- |
| Node.js | npm、pnpm、yarn、bun 的 install/remove/run 工作流 |
| Monorepo | pnpm 和 yarn workspace 的脚本发现与包管理器选择 |
| Go | `go get`、`go mod tidy`、`go run`、`go mod init`、`go build` |
| Rust | `cargo install`、`cargo uninstall`、`cargo run`、`cargo init`、`cargo build` |
| Python | 通过 `prun` / `pfind` 执行 Python 入口文件 |

## 命令参考

| 命令 | 说明 |
| --- | --- |
| `pi [pkg]` | 安装指定包；不传包名时更新依赖。 |
| `pil [pkg]` | 将选择的依赖安装到 `@latest`。 |
| `pui [pkg]` | 卸载依赖。 |
| `pio [pkg]` | 使用检测到的包管理器并带上 `--prefer-offline` 安装。 |
| `pix [cmd]` | 根据项目运行 `npx` 或 `bunx`。 |
| `prun [script]` | 运行 package script、模糊选择 script，或运行语言入口文件。 |
| `pfind [script]` | 在 workspace 包中搜索并运行匹配的 scripts。 |
| `pinit` | 使用检测到的工具初始化当前项目。 |
| `pbuild` | 在 Go/Rust 项目中执行 `go build` 或 `cargo build`。 |
| `pci` | 使用和 `pi` 相同的路由安装；支持包管理器选择参数。 |
| `pa` | 当外部 `na` 命令可用时透传给 `na`。 |
| `pu` | 当外部 `nu` 命令可用时透传给 `nu`。 |

## Workspace 工具选择

当同一个 workspace 里同时存在多种包管理器标记时，例如 `bun.lock` 和 `pnpm-lock.yaml`，`pi`、`pil`、`pci` 会先让你选择一次当前 workspace 使用哪种工具，并把这个选择记住。

- 选择会保存在本机配置目录中，例如 `~/.config/pi/workspace-tools.json`。
- 这是本地机器配置，不应该提交到仓库中。
- 如果之前记住的工具不再匹配当前 workspace，PI 会自动清理失效记录。

```bash
pi --choose-tool
pi --choose-tool bun
pi --forget-tool
pi --show-tool
pi --show-tool --json
pi --list-tools
pi --list-tools --json
```

`pil` 和 `pci` 支持同样的包管理器选择参数。`pui`、`pio` 在解析包管理器时也会复用已保存的 workspace 选择。

## Shell 集成

`prun` 和 `pfind` 可以把模糊选择出的命令立即写入当前 shell 历史记录。

手动启用：

```bash
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

Shell 集成说明：

默认情况下，PI 不会修改你的 shell rc/profile。

- 如果希望首次交互式运行时自动写入，可以显式运行 `PI_AUTO_INIT=1 prun`。
- 可运行 `prun --doctor` 查看 shell/history 集成状态。
- 写入 hook 后，请打开新终端或重新加载 shell 配置。

## 配置

```bash
export PI_Lang=zh        # zh 或 en
export PI_DEFAULT=pnpm   # 兜底包管理器
export PI_COLOR=yellow   # ora 颜色
export PI_SPINNER=star   # cli-spinners 名称
```

`PI_COLOR` 支持 `black`、`red`、`green`、`yellow`、`blue`、`magenta`、`cyan`、`white`、`gray`。

## 示例

### pi

![安装依赖示例](https://raw.githubusercontent.com/Simon-He95/pi/main/assets/pi.png)

![安装依赖动画](https://raw.githubusercontent.com/Simon-He95/pi/main/assets/pi.gif)

### prun

![运行命令示例](https://raw.githubusercontent.com/Simon-He95/pi/main/assets/prun.png)

![运行命令动画](https://raw.githubusercontent.com/Simon-He95/pi/main/assets/prun.gif)

### pfind

![查找命令动画](https://raw.githubusercontent.com/Simon-He95/pi/main/assets/pfind.gif)

### pui

![卸载依赖示例](https://raw.githubusercontent.com/Simon-He95/pi/main/assets/pui.png)

### 其他功能

![其他功能动画](https://raw.githubusercontent.com/Simon-He95/pi/main/assets/others.gif)

## 开发检查

```bash
pnpm build
pnpm test
pnpm pack:check
pnpm smoke
```

## 运行时集成

- [ora](https://github.com/sindresorhus/ora)
- [ccommand](https://github.com/Simon-He95/ccommand)

当前项目需要时会使用可选外部工具：

- [Cargo](https://github.com/rust-lang/cargo)：Rust 工作流
- Go 工具链：Go 工作流
- Python：Python 文件执行

## License

[MIT](./LICENSE) License © 2022 [Simon He](https://github.com/Simon-He95)

<a href="https://github.com/Simon-He95/sponsor" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" style="height: 51px !important;width: 217px !important;" ></a>
