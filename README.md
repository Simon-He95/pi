<span ><p align="center">![kv](/assets/pi.png)</p></span>

<p align="center"> English | <a href="./README_zh.md">简体中文</a></p>
<p align="center"><a href="https://www.npmjs.com/package/@simon_he/pi"><img src="https://img.shields.io/npm/v/@simon_he/pi?color=3fb883&amp;label=" alt="NPM version"></a>

## :lollipop: PI

A smart package manager with a custom loading style, which makes you install dependencies more beautifully :)

## :rocket: Smart package manager

- Supports dependency installation, uninstallation, execution and packaging of go mod
- Supports Cargo's dependency installation, uninstallation, execution and packaging
- Support npm dependency installation, uninstallation and execution
- Support pnpm dependency installation, uninstallation and execution
- Support yarn dependency installation, uninstallation and execution

https://user-images.githubusercontent.com/57086651/203143603-9e78f686-399e-4c3d-ae53-56638501b276.mov

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
  # Initialization
  pinit
  # build - for cargo, go
  pbuild
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
```

- 70+ types of styles, from [cli-spinners](https://jsfiddle.net/sindresorhus/2eLtsbey/embedded/result/)，You can choose to fill in the name in PI_SPINNER.
- Color options: 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray', Fill in PI_COLOR.

## :battery: Dependency

- [@antfu/ni](https://github.com/antfu/ni)
- [ora](https://github.com/sindresorhus/ora)
- [ccommand](https://github.com/Simon-He95/ccommand)

## License

[MIT](./LICENSE) License © 2022 [Simon He](https://github.com/Simon-He95)

## :coffee:

<a href="https://github.com/Simon-He95/sponsor" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" style="height: 51px !important;width: 217px !important;" ></a>
