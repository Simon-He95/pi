import process from 'node:process'
import { ensurePrunAutoInit } from './prun'
import { getCcommand } from './require'

function isNoHistory(value?: string) {
  if (!value)
    return false
  const normalized = value.toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

function shouldSuppressHistory() {
  return isNoHistory(process.env.CCOMMAND_NO_HISTORY)
    || isNoHistory(process.env.NO_HISTORY)
}

// workspace find script
export async function pfind(params: string) {
  ensurePrunAutoInit()
  const prevNoHistory = process.env.CCOMMAND_NO_HISTORY
  const shouldWriteHistory = !shouldSuppressHistory()
  if (shouldWriteHistory)
    delete process.env.CCOMMAND_NO_HISTORY
  else
    process.env.CCOMMAND_NO_HISTORY = '1'
  const { ccommand } = getCcommand()
  try {
    await ccommand(`find ${params}`)
  }
  finally {
    if (prevNoHistory == null)
      delete process.env.CCOMMAND_NO_HISTORY
    else
      process.env.CCOMMAND_NO_HISTORY = prevNoHistory
  }
}
