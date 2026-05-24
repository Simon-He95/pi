import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const nodeBin = process.execPath
const root = process.cwd()

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
}

const packOutput = execFileSync(npmBin, ['pack', '--json'], {
  cwd: root,
  encoding: 'utf8',
})
const [{ filename }] = JSON.parse(packOutput)
const packedFile = join(root, filename)
const tmp = mkdtempSync(join(tmpdir(), 'pi-packed-smoke-'))

try {
  copyFileSync(packedFile, join(tmp, filename))

  run(npmBin, ['init', '-y'], tmp)
  run(npmBin, ['install', `./${filename}`], tmp)

  for (const bin of [
    'pi',
    'pio',
    'pix',
    'pa',
    'pu',
    'pci',
    'pil',
    'pui',
    'prun',
    'pinit',
    'pbuild',
    'pfind',
  ]) {
    const binFile = process.platform === 'win32' ? `${bin}.cmd` : bin
    run(join(tmp, 'node_modules', '.bin', binFile), ['--version'], tmp)
  }

  run(nodeBin, [
    '--input-type=module',
    '-e',
    'const { setup } = await import(\'@simon_he/pi\'); if (typeof setup !== \'function\') process.exit(1)',
  ], tmp)

  run(nodeBin, [
    '-e',
    'const { setup } = require(\'@simon_he/pi\'); if (typeof setup !== \'function\') process.exit(1)',
  ], tmp)
}
finally {
  rmSync(tmp, { recursive: true, force: true })
  rmSync(packedFile, { force: true })
}
