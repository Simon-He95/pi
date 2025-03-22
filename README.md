<p align="center">
  <img src="/assets/kv.png" alt="PI - Smart Package Manager">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@simon_he/pi"><img src="https://img.shields.io/npm/v/@simon_he/pi?color=3fb883&amp;label=" alt="NPM version"></a>
  <a href="https://www.npmjs.com/package/@simon_he/pi"><img src="https://img.shields.io/npm/dm/@simon_he/pi.svg?color=3fb883&label=" alt="NPM Downloads"></a>
  <a href="https://github.com/Simon-He95/pi/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Simon-He95/pi?color=3fb883" alt="License"></a>
</p>

<p align="center">English | <a href="./README_zh.md">简体中文</a></p>

## 📖 Table of Contents

- [Introduction](#-pi)
- [Features](#-smart-package-manager)
- [Examples](#-examples)
- [Language Settings](#-language)
- [Installation](#-installation)
- [Usage](#-usage)
- [Supported Features](#-features)
- [Special Features](#-feature)
- [Custom Configuration](#-custom-configuration)
- [Dependencies](#-dependencies)
- [License](#license)

## 🍭 PI

PI is an intelligent package manager with beautiful custom loading styles, providing a better visual experience when installing dependencies. It can intelligently identify project environments, fuzzy match commands, and find deep-nested instructions, greatly improving development efficiency.

## 🚀 Smart Package Manager

PI supports package management for multiple environments:

- ✅ **Go**: Supports dependency installation, uninstallation, execution, and packaging with go mod
- ✅ **Rust**: Supports dependency installation, uninstallation, execution, and packaging with Cargo
- ✅ **Node.js**: Supports dependency installation, uninstallation, and execution with npm, pnpm, and yarn
- ✅ **Python**: Supports Python file execution
- ✅ **Monorepo**: Automatically identifies and handles differences between yarn and pnpm workspaces, fixing monorepo installation issues

## 📷 Examples

### pi - Install Dependencies

![Install Dependencies Example](/assets/pi.png)

![Install Dependencies Animation](/assets/pi.gif)

### pil - Install the latest dependencies

![Example of running a command](/assets/prun.png)

### pui - Uninstall Dependencies

![Uninstall Dependencies Example](/assets/pui.png)

### pci - Clear Cache

![Clear Cache Example](/assets/pci.png)

### prun - Run Commands

![Run Commands Example](/assets/prun.png)

![Run Commands Animation](/assets/prun.gif)

### pfind - Find Commands

![Find Commands Animation](/assets/pfind.gif)

### Other Features

![Other Features Animation](/assets/others.gif)

## 📱 Language

```bash
# Set environment variables in your bash or zsh configuration file

# Chinese
export PI_Lang=zh

# English
export PI_Lang=en
```

## :gear: Install

```
  npm i -g @simon_he/pi
```

## :open_hands: Usage

```
  # According to the environment of the current directory to analyze which package manager to use，go、rust、pnpm、yarn、npm
  # Install dependencies
  pi xxx
  # Uninstall dependencies
  pui xxx
  # Execute command
  prun
  # Execute scripts in workspace
  # Execute index.js | index.ts in js | ts files or directories
  # Execute main.go in go files or directories
  # Execute main.rs in rust files or directories
  # Execute main.py in python files or directories
  pfind
  # Initialization
  pinit
  # build - for cargo, go
  pbuild
  # pci

```

## Power

The current environment is npm | yarn | pnpm, and it supports passing some args --silent

- prun dev The dev command in the current package.json
- prun If no command is specified, provide all scripts command options under the current package
- prun playground, provide all scripts command options under the current package

The current environment is go

- prun message, it will find message.go first, if not found, it will find message/main.go to execute

The current environment is rust

- prun executable cargo run

workspace of pnpm ｜ yarn

- pfind Select the package under the current workspace, and then select the corresponding command

## :monocle_face: Feature

```
<-- Go -->
 ## input folder and executor command
 prun  # default executor main.go
 prun table # if table.go exists, executor table.go else executor table/main.go. and table can under any folder. For example, examples/table/main.go will also be found and executed
<-- Go -->
```

## :bulb: Custom configuration

You can configure the loading style in .zshrc, as follows：

```
export PI_COLOR=red # loadingstyle color
export PI_SPINNER=star # loadingstyle
export PI_DEFAULT=pnpm # If the current project does not set the installed package manager, you can set the default installation here
```

- 70+ types of styles, from [cli-spinners](https://jsfiddle.net/sindresorhus/2eLtsbey/embedded/result/)，You can choose to fill in the name in PI_SPINNER.
- Color options: 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray', Fill in PI_COLOR.

## :battery: Dependency

- [@antfu/ni](https://github.com/antfu/ni)
- [ora](https://github.com/sindresorhus/ora)
- [ccommand](https://github.com/Simon-He95/ccommand)
- [cargo](https://github.com/rust-lang/cargo)

## License

[MIT](./LICENSE) License © 2022 [Simon He](https://github.com/Simon-He95)

<a href="https://github.com/Simon-He95/sponsor" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" style="height: 51px !important;width: 217px !important;" ></a>
