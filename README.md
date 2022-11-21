<span ><p align="center">![kv](/assets/pi.png)</p></span>

## PI
一个带有自定义loading样式的smart包管理器，让你安装依赖时更加美观:),支持pnpm、yarn、npm、rust、go的执行


https://user-images.githubusercontent.com/57086651/203143603-9e78f686-399e-4c3d-ae53-56638501b276.mov


## 安装
```
  npm i -g @simon_he/pi
```

## 使用
```
  # 根据当前目录的环境去分析使用哪种包管理器，go、rust、pnpm、yarn、npm
  # 安装依赖
  pi xxx
  # 卸载依赖
  pui xxx
  # 执行命令
  prun
```

## 自定义配置
可以在.zshrc配置loading样式，如下：
```
export PI_COLOR=red # loading样式颜色
export PI_SPINNER=star # loading样式
```
- 样式的种类70+，来源于[cli-spinners](https://jsfiddle.net/sindresorhus/2eLtsbey/embedded/result/)，可自行选择将名字填入PI_SPINNER中。
- 颜色可选值：'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray', 填入PI_COLOR中

## 依赖
- [@antfu/ni](https://github.com/antfu/ni)
- [ora](https://github.com/sindresorhus/ora)
- [ccommand](https://github.com/Simon-He95/ccommand)


## :coffee: 
<a href="https://github.com/Simon-He95/sponsor" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" style="height: 51px !important;width: 217px !important;" ></a>
