import { jsShell, useProcressNodeWorker } from 'simon-js-tool'

useProcressNodeWorker(async command =>
  jsShell(`${command}`, 'pipe'),
)
