import { jsShell, useProcressNodeWorker } from 'simon-js-tool'

useProcressNodeWorker(async ({ params, operate }) =>
  jsShell(`${operate === 'install' ? 'ni' : 'nun'} ${params}`, 'pipe'),
)
