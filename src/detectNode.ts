import process from 'process'
import { getPkg, jsShell } from 'lazy-js-utils/dist/node'
import colors from 'picocolors'

export async function detectNode() {
  let pkg
  try {
    pkg = await getPkg()
  }
  catch (e: any) {
    const cwd = process.cwd()
    console.log(colors.red(`当前目录: ${cwd} 没有package.json文件`))
    process.exit(1)
  }
  if (pkg.engines?.node) {
    const isSafe = require('semver').satisfies(
      process.version,
      pkg.engines.node,
    )

    if (!isSafe) {
      const { result, status } = await jsShell(
        `echo "yes\nno" | gum filter --placeholder=" 当前node版本不满足 ${pkg.engines.node}，是否切换node版本"`,
        ['inherit', 'pipe', 'inherit'],
      )
      if (status === 0 && result === 'yes') {
        await jsShell(
          `
           current=$(echo $(fnm current))
           registery=$(echo "$(fnm ls)" | sed 's/system//g' | sed 's/default//g' | sed 's/\* //g' | sed "s/$current/\* $current/g" | gum filter --placeholder=" 请选择一个node版本")
           registery=$(echo $\{registery// /} | sed 's/\*//g')
           if [ $registery ]; then
            fnm use $\{registery% -*}
           fi
          `,
          ['inherit', 'pipe', 'inherit'],
        )
      }
    }
  }
}
