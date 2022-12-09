import { jsShell, useProcressNodeWorker } from 'lazy-js-utils'

useProcressNodeWorker(async command => jsShell(`${command}`, 'pipe'))
