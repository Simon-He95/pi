<span ><p align="center">![kv](/assets/pi.png)</p></span>

## PI
一个带有loading样式的包安装器，让你安装依赖时更加美观:)

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
