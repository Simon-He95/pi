import process from 'node:process'
import { getPkg, isInstallPkg, jsShell } from 'lazy-js-utils/node'
import colors from 'picocolors'

const isZh = process.env.PI_Lang === 'zh'

export async function detectNode() {
  let pkg
  try {
    pkg = await getPkg()
  }
  catch {
    const cwd = process.cwd()
    console.log(colors.red(`当前目录: ${cwd} 没有package.json文件`))
    process.exit(1)
  }
  if (pkg.engines?.node) {
    const semver = await import('semver')
    const satisfies
      = (semver as any).satisfies || (semver as any).default?.satisfies
    if (!satisfies)
      return
    const isSafe = satisfies(process.version, pkg.engines.node)

    if (!isSafe) {
      const hasGum = await isInstallPkg('gum')
      const hasFnm = await isInstallPkg('fnm')
      if (!hasGum || !hasFnm) {
        const missing = [
          !hasGum ? 'gum' : '',
          !hasFnm ? 'fnm' : '',
        ]
          .filter(Boolean)
          .join(', ')
        console.log(
          colors.yellow(
            isZh
              ? `当前 node 版本不满足 ${pkg.engines.node}，未检测到 ${missing}，请手动切换版本。`
              : `Current Node version does not satisfy ${pkg.engines.node}. Missing ${missing}. Please switch manually.`,
          ),
        )
        return
      }
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
