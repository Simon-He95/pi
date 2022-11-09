import { parentPort } from 'worker_threads'
import { jsShell } from 'simon-js-tool'

parentPort.on('message', async params =>
  parentPort.postMessage(await jsShell(`ni ${params}`, 'pipe')),
)
