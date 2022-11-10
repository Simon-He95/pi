import { jsShell, useProcressNodeWorker } from 'simon-js-tool'

useProcressNodeWorker(async ({ params, operate }) => {
  return jsShell(`${operate === 'install' ? 'ni' : 'nun'} ${params}`, 'pipe')
})
