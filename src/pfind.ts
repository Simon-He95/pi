import process from 'node:process'
import { getCcommand } from './require'

function isNoHistory(value?: string) {
  if (!value)
    return false
  const normalized = value.toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

// workspace find script
export async function pfind(params: string) {
  const hadNoHistoryEnv = process.env.CCOMMAND_NO_HISTORY != null || process.env.NO_HISTORY != null
  const initialNoHistory = process.env.CCOMMAND_NO_HISTORY ?? process.env.NO_HISTORY
  const shouldWriteHistory = !(hadNoHistoryEnv && isNoHistory(initialNoHistory))
  const prevNoHistory = process.env.CCOMMAND_NO_HISTORY
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
