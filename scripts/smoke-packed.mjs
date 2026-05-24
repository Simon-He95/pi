import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const nodeBin = process.execPath
const root = process.cwd()

function run(command, args, cwd, extraEnv = {}) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      ...extraEnv,
    },
  })
}

const packOutput = execFileSync(npmBin, ['pack', '--json'], {
  cwd: root,
  encoding: 'utf8',
})
const [pack] = JSON.parse(packOutput)
const { filename } = pack
const packedPaths = new Set(pack.files?.map(file => file.path) ?? [])

for (const requiredPath of [
  'README.md',
  'README_zh.md',
  'pi.mjs',
  'pio.mjs',
  'pix.mjs',
  'pa.mjs',
  'pu.mjs',
  'pci.mjs',
  'pil.mjs',
  'pui.mjs',
  'prun.mjs',
  'pinit.mjs',
  'pbuild.mjs',
  'pfind.mjs',
  'dist/index.cjs',
  'dist/index.mjs',
  'dist/cli.cjs',
  'dist/index.d.cts',
  'dist/index.d.mts',
]) {
  if (!packedPaths.has(requiredPath))
    throw new Error(`Packed tarball is missing ${requiredPath}`)
}

const packedFile = join(root, filename)
const tmp = mkdtempSync(join(tmpdir(), 'pi-packed-smoke-'))

try {
  copyFileSync(packedFile, join(tmp, filename))

  run(npmBin, ['init', '-y'], tmp)
  run(npmBin, ['install', `./${filename}`], tmp)
  run(npmBin, ['install', '-D', 'typescript@5.9.3'], tmp)

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

  const nodeProject = join(tmp, 'node-project')
  mkdirSync(nodeProject)
  writeFileSync(
    join(nodeProject, 'package.json'),
    '{"name":"node-project","version":"0.0.0","scripts":{"dev":"node -e \\"console.log(1)\\""}}\n',
  )
  writeFileSync(join(nodeProject, 'package-lock.json'), '')

  const prunBin = process.platform === 'win32' ? 'prun.cmd' : 'prun'
  run(
    join(tmp, 'node_modules', '.bin', prunBin),
    ['dev'],
    nodeProject,
    {
      CCOMMAND_NO_HISTORY: '1',
      PI_NO_AUTO_INIT: '1',
    },
  )

  run(nodeBin, [
    '--input-type=module',
    '-e',
    'const { setup } = await import(\'@simon_he/pi\'); if (typeof setup !== \'function\') process.exit(1)',
  ], tmp)

  run(nodeBin, [
    '-e',
    'const { setup } = require(\'@simon_he/pi\'); if (typeof setup !== \'function\') process.exit(1)',
  ], tmp)

  writeFileSync(
    join(tmp, 'import-smoke.mts'),
    [
      'import { setup } from \'@simon_he/pi\'',
      'void setup',
      '',
    ].join('\n'),
  )

  writeFileSync(
    join(tmp, 'require-smoke.cts'),
    [
      'import pi = require(\'@simon_he/pi\')',
      'void pi.setup',
      '',
    ].join('\n'),
  )

  const tscBin = process.platform === 'win32' ? 'tsc.cmd' : 'tsc'
  run(join(tmp, 'node_modules', '.bin', tscBin), [
    '--module',
    'nodenext',
    '--moduleResolution',
    'nodenext',
    '--target',
    'ES2022',
    '--noEmit',
    'import-smoke.mts',
    'require-smoke.cts',
  ], tmp)
}
finally {
  rmSync(tmp, { recursive: true, force: true })
  rmSync(packedFile, { force: true })
}
