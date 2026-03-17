import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { isFile } from 'lazy-js-utils'
import { getPkgTool } from 'lazy-js-utils/node'
import colors from 'picocolors'
import { isInteractive, ttySelect } from './tty'

export type PkgTool = string
export type PkgToolResolutionSource
  = | 'saved-preference'
    | 'fresh-selection'
    | 'single-candidate'
    | 'env-default'
    | 'detected-tool'
    | 'non-interactive-fallback'

interface ToolCandidate {
  tool: PkgTool
  root: string
  indicators: string[]
}

interface WorkspaceToolPreferences {
  version: 1
  workspaces: Record<string, PkgTool>
}

export interface ResolvePkgToolOptions {
  forceChoose?: boolean
  forgetPreference?: boolean
  preferredTool?: PkgTool
}

export interface ResolvePkgToolResult {
  detected: PkgTool
  tool: PkgTool
  source: PkgToolResolutionSource
}

interface PkgToolCandidateInfo {
  tool: PkgTool
  indicators: string[]
  root: string
}

export type PkgToolStatus
  = | {
    status: 'resolved'
    detected: PkgTool
    tool: PkgTool
    source: Exclude<PkgToolResolutionSource, 'fresh-selection'>
    candidates: PkgToolCandidateInfo[]
  }
  | {
    status: 'needs-selection'
    detected: PkgTool
    candidates: PkgToolCandidateInfo[]
  }

interface PrintPkgToolStatusOptions {
  json?: boolean
}

type ToolSelectionResult
  = | { status: 'selected', tool: PkgTool }
    | { status: 'cancelled' }
    | { status: 'unavailable' }

interface PreparedPkgToolContext {
  detected: PkgTool
  candidates: ToolCandidate[]
  rememberedTool?: PkgTool
}

const resolvedToolCache = new Map<string, Promise<ResolvePkgToolResult>>()

const toolIndicatorMap: Record<string, string[]> = {
  pnpm: ['pnpm-workspace.yaml', 'pnpm-lock.yaml'],
  yarn: ['yarn.lock', '.yarnrc.yml'],
  bun: ['bun.lock', 'bun.lockb'],
  npm: ['package-lock.json', 'npm-shrinkwrap.json'],
}

const isZh = process.env.PI_Lang === 'zh'
const supportedPkgTools = Object.keys(toolIndicatorMap) as PkgTool[]

function isEnabled(value?: string) {
  if (!value)
    return false
  const normalized = value.toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

function normalizeDir(dir: string) {
  return path.resolve(dir)
}

function isSameOrInsideDir(base: string, target: string) {
  const relative = path.relative(base, target)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function findUpSync(startDir: string, predicate: (dir: string) => boolean) {
  let current = normalizeDir(startDir)
  while (true) {
    if (predicate(current))
      return current
    const parent = path.dirname(current)
    if (parent === current)
      return null
    current = parent
  }
}

function findToolCandidate(cwd: string, tool: PkgTool): ToolCandidate | null {
  const indicators = toolIndicatorMap[tool]
  if (!indicators?.length)
    return null

  const root = findUpSync(cwd, dir => indicators.some(indicator => isFile(path.join(dir, indicator))))
  if (!root)
    return null

  const foundIndicators = indicators.filter(indicator => isFile(path.join(root, indicator)))

  return {
    tool,
    root,
    indicators: foundIndicators.length ? foundIndicators : indicators.slice(0, 1),
  }
}

function getToolCandidates(cwd: string): ToolCandidate[] {
  return Object.keys(toolIndicatorMap)
    .map(tool => findToolCandidate(cwd, tool))
    .filter(Boolean) as ToolCandidate[]
}

function getPreferenceWorkspaceKey(cwd: string, candidates: ToolCandidate[]) {
  const roots = [...new Set(candidates.map(candidate => normalizeDir(candidate.root)))]
  if (roots.length === 1)
    return roots[0]
  return normalizeDir(cwd)
}

function findStoredWorkspaceKey(cwd: string, preferences: WorkspaceToolPreferences) {
  return Object.keys(preferences.workspaces)
    .filter(workspaceKey => isSameOrInsideDir(workspaceKey, cwd))
    .sort((a, b) => b.length - a.length)[0] || null
}

function resolveWorkspaceKey(
  cwd: string,
  candidates: ToolCandidate[],
  preferences: WorkspaceToolPreferences,
) {
  if (candidates.length > 0)
    return getPreferenceWorkspaceKey(cwd, candidates)
  return findStoredWorkspaceKey(cwd, preferences) || normalizeDir(cwd)
}

function getConfigHome() {
  const home = process.env.HOME || os.homedir()
  if (process.platform === 'win32') {
    return process.env.APPDATA || path.join(home, 'AppData', 'Roaming')
  }
  return process.env.XDG_CONFIG_HOME || path.join(home, '.config')
}

function getWorkspaceToolPreferencePath() {
  return path.join(getConfigHome(), 'pi', 'workspace-tools.json')
}

async function readWorkspaceToolPreferences(): Promise<WorkspaceToolPreferences> {
  const configPath = getWorkspaceToolPreferencePath()
  try {
    const raw = await fs.readFile(configPath, 'utf8')
    const parsed = JSON.parse(raw) as Partial<WorkspaceToolPreferences>
    return {
      version: 1,
      workspaces: parsed.workspaces && typeof parsed.workspaces === 'object'
        ? parsed.workspaces as Record<string, PkgTool>
        : {},
    }
  }
  catch {
    return {
      version: 1,
      workspaces: {},
    }
  }
}

async function writeWorkspaceToolPreference(workspaceKey: string, tool: PkgTool) {
  const configPath = getWorkspaceToolPreferencePath()
  const data = await readWorkspaceToolPreferences()
  data.workspaces[workspaceKey] = tool
  await fs.mkdir(path.dirname(configPath), { recursive: true })
  await fs.writeFile(configPath, JSON.stringify(data, null, 2), 'utf8')
  resolvedToolCache.clear()
}

async function deleteWorkspaceToolPreference(workspaceKey: string) {
  const configPath = getWorkspaceToolPreferencePath()
  const data = await readWorkspaceToolPreferences()
  if (!(workspaceKey in data.workspaces))
    return

  delete data.workspaces[workspaceKey]
  await fs.mkdir(path.dirname(configPath), { recursive: true })
  await fs.writeFile(configPath, JSON.stringify(data, null, 2), 'utf8')
  resolvedToolCache.clear()
}

export async function forgetPkgToolPreference() {
  const cwd = normalizeDir(process.cwd())
  const preferences = await readWorkspaceToolPreferences()
  const workspaceKey = findStoredWorkspaceKey(cwd, preferences)
  if (!workspaceKey)
    return false
  await deleteWorkspaceToolPreference(workspaceKey)
  return true
}

export function getSupportedPkgToolNames() {
  return supportedPkgTools.slice()
}

function getPreferredToolFromEnv(candidates: ToolCandidate[]) {
  const preferred = process.env.PI_DEFAULT
  if (!preferred)
    return null
  return candidates.some(candidate => candidate.tool === preferred) ? preferred : null
}

function getExplicitPreferredTool(value?: string | null) {
  if (!value)
    return null
  return supportedPkgTools.includes(value) ? value : null
}

function validateExplicitPreferredTool(preferredTool: PkgTool, candidates: ToolCandidate[]) {
  if (candidates.length === 0)
    return true
  return candidates.some(candidate => candidate.tool === preferredTool)
}

function logInvalidPreferredTool(preferredTool: PkgTool, candidates: ToolCandidate[]) {
  const names = candidates.map(candidate => candidate.tool).join(', ')
  console.log(
    colors.red(
      isZh
        ? `当前 workspace 可选的包管理器是: ${names}，不能直接指定 ${preferredTool}。`
        : `This workspace supports: ${names}. ${preferredTool} cannot be selected directly here.`,
    ),
  )
}

function getDetectedToolFallback(detected: PkgTool, candidates: ToolCandidate[]) {
  if (candidates.some(candidate => candidate.tool === detected))
    return detected
  return candidates[0]?.tool || detected
}

function formatCandidateLabel(candidate: ToolCandidate, cwd: string) {
  const indicators = candidate.indicators.join(', ')
  const relativeRoot = path.relative(cwd, candidate.root) || '.'
  if (relativeRoot === '.')
    return `${candidate.tool}: ${indicators}`
  return `${candidate.tool}: ${indicators} (${relativeRoot})`
}

function toCandidateInfo(candidates: ToolCandidate[]): PkgToolCandidateInfo[] {
  return candidates.map(candidate => ({
    tool: candidate.tool,
    indicators: candidate.indicators,
    root: candidate.root,
  }))
}

async function selectToolCandidate(candidates: ToolCandidate[], cwd: string) {
  if (!isInteractive())
    return { status: 'unavailable' } satisfies ToolSelectionResult

  const options = candidates.map(candidate => formatCandidateLabel(candidate, cwd))
  const labelToTool = new Map(
    candidates.map(candidate => [formatCandidateLabel(candidate, cwd), candidate.tool]),
  )
  const choice = await ttySelect(
    options,
    isZh
      ? '🤔检测到多个包管理环境，请选择当前 workspace 使用的安装方式'
      : 'Multiple package managers were detected, choose one for this workspace.',
  )
  if (!choice)
    return { status: 'cancelled' } satisfies ToolSelectionResult

  const tool = labelToTool.get(choice)
  if (!tool)
    return { status: 'cancelled' } satisfies ToolSelectionResult

  return {
    status: 'selected',
    tool,
  } satisfies ToolSelectionResult
}

function logAmbiguousToolFallback(candidates: ToolCandidate[], tool: PkgTool) {
  const names = candidates.map(candidate => candidate.tool).join(', ')
  console.log(
    colors.yellow(
      isZh
        ? `检测到多个包管理环境(${names})，当前不是交互式终端，临时使用 ${tool}。可在交互式终端运行一次 pi 以保存当前 workspace 的选择。`
        : `Detected multiple package managers (${names}). Using ${tool} for now because no interactive TTY is available. Run pi once in an interactive shell to save this workspace preference.`,
    ),
  )
}

function getSourceLabel(source: PkgToolResolutionSource) {
  switch (source) {
    case 'saved-preference':
      return isZh ? '已保存的 workspace 选择' : 'saved workspace choice'
    case 'fresh-selection':
      return isZh ? '本次重新选择并保存' : 'picked now and saved'
    case 'single-candidate':
      return isZh ? '当前只检测到一种包管理器标记' : 'single detected package-manager indicator'
    case 'env-default':
      return isZh ? 'PI_DEFAULT 兜底' : 'PI_DEFAULT fallback'
    case 'detected-tool':
      return isZh ? '环境自动检测结果' : 'environment auto-detection'
    case 'non-interactive-fallback':
      return isZh ? '非交互终端下的临时兜底' : 'non-interactive fallback'
  }
}

function logWorkspaceToolSelected(tool: PkgTool, forceChoose: boolean) {
  console.log(
    colors.green(
      forceChoose
        ? isZh
          ? `当前 workspace 已切换为使用 ${tool}，并保存了这个选择。`
          : `This workspace now uses ${tool}, and the choice has been saved.`
        : isZh
          ? `已为当前 workspace 记住 ${tool} 作为包管理器。`
          : `Saved ${tool} as the package manager for this workspace.`,
    ),
  )
}

function logWorkspaceToolResolved(tool: PkgTool) {
  console.log(
    colors.green(
      isZh
        ? `当前 workspace 使用 ${tool} 作为包管理器。`
        : `This workspace uses ${tool} as the package manager.`,
    ),
  )
}

function logStaleWorkspaceToolRemoved(tool: PkgTool) {
  console.log(
    colors.yellow(
      isZh
        ? `检测到之前保存的 ${tool} 已不再适用于当前 workspace，已自动清除旧记录。`
        : `The saved ${tool} choice no longer matches this workspace and was removed automatically.`,
    ),
  )
}

async function preparePkgToolContext(forgetPreference = false): Promise<PreparedPkgToolContext> {
  const cwd = normalizeDir(process.cwd())
  const originalDetected = (await getPkgTool()) || 'npm'
  const candidates = getToolCandidates(cwd)
  const preferences = await readWorkspaceToolPreferences()
  const workspaceKey = resolveWorkspaceKey(cwd, candidates, preferences)
  let detected = originalDetected

  if (forgetPreference)
    await deleteWorkspaceToolPreference(workspaceKey)
  if (forgetPreference)
    delete preferences.workspaces[workspaceKey]

  let rememberedTool = preferences.workspaces[workspaceKey]
  if (rememberedTool && !candidates.some(candidate => candidate.tool === rememberedTool)) {
    await deleteWorkspaceToolPreference(workspaceKey)
    delete preferences.workspaces[workspaceKey]
    logStaleWorkspaceToolRemoved(rememberedTool)
    rememberedTool = undefined
  }

  if (detected === 'npm' && candidates.length === 1)
    detected = candidates[0].tool

  return {
    detected,
    candidates,
    rememberedTool,
  }
}

export async function getPkgToolStatus(): Promise<PkgToolStatus> {
  const { detected, candidates, rememberedTool } = await preparePkgToolContext()
  const candidateInfo = toCandidateInfo(candidates)

  if (rememberedTool) {
    return {
      status: 'resolved',
      detected,
      tool: rememberedTool,
      source: 'saved-preference',
      candidates: candidateInfo,
    }
  }

  if (candidates.length <= 1) {
    const fallback = process.env.PI_DEFAULT
    const tool = detected === 'npm' && fallback ? fallback : detected
    const source: Exclude<PkgToolResolutionSource, 'fresh-selection'> = detected === 'npm' && fallback
      ? 'env-default'
      : candidates.length === 1
        ? 'single-candidate'
        : 'detected-tool'
    return {
      status: 'resolved',
      detected,
      tool,
      source,
      candidates: candidateInfo,
    }
  }

  const envPreferredTool = getPreferredToolFromEnv(candidates)
  if (envPreferredTool) {
    return {
      status: 'resolved',
      detected,
      tool: envPreferredTool,
      source: 'env-default',
      candidates: candidateInfo,
    }
  }

  if (!isInteractive()) {
    const tool = getDetectedToolFallback(detected, candidates)
    return {
      status: 'resolved',
      detected,
      tool,
      source: 'non-interactive-fallback',
      candidates: candidateInfo,
    }
  }

  return {
    status: 'needs-selection',
    detected,
    candidates: candidateInfo,
  }
}

export function printPkgToolStatus(
  status: PkgToolStatus,
  options: PrintPkgToolStatusOptions = {},
) {
  if (options.json) {
    console.log(JSON.stringify({
      ...status,
      sourceLabel: status.status === 'resolved' ? getSourceLabel(status.source) : undefined,
    }, null, 2))
    return
  }

  if (status.status === 'resolved') {
    const candidateNames = status.candidates.map(candidate => candidate.tool).join(', ')
    console.log(
      colors.green(
        isZh
          ? `当前 workspace 使用 ${status.tool} 作为包管理器。`
          : `This workspace uses ${status.tool} as the package manager.`,
      ),
    )
    console.log(colors.cyan(`${isZh ? '来源' : 'Source'}: ${getSourceLabel(status.source)}`))
    if (candidateNames)
      console.log(colors.dim(`${isZh ? '候选项' : 'Candidates'}: ${candidateNames}`))
    return
  }

  const candidateNames = status.candidates.map(candidate => candidate.tool).join(', ')
  console.log(
    colors.yellow(
      isZh
        ? '当前 workspace 还没有固定包管理器选择。'
        : 'This workspace does not have a locked package-manager choice yet.',
    ),
  )
  console.log(
    colors.cyan(
      `${isZh ? '原因' : 'Reason'}: ${
        isZh
          ? '检测到了多个包管理器标记，且当前没有保存的选择。'
          : 'Multiple package-manager indicators were found and no saved choice exists yet.'
      }`,
    ),
  )
  console.log(colors.dim(`${isZh ? '候选项' : 'Candidates'}: ${candidateNames}`))
  console.log(
    colors.dim(
      isZh ? '可执行 `pi --choose-tool` 来保存当前 workspace 的选择。' : 'Run `pi --choose-tool` to save a choice for this workspace.',
    ),
  )
}

export function printPkgToolCandidates(
  status: PkgToolStatus,
  options: PrintPkgToolStatusOptions = {},
) {
  if (options.json) {
    console.log(JSON.stringify({
      ...status,
      sourceLabel: status.status === 'resolved' ? getSourceLabel(status.source) : undefined,
    }, null, 2))
    return
  }

  if (status.status === 'resolved') {
    console.log(
      colors.green(
        isZh
          ? `当前 workspace 使用 ${status.tool} 作为包管理器。`
          : `This workspace uses ${status.tool} as the package manager.`,
      ),
    )
    console.log(colors.cyan(`${isZh ? '来源' : 'Source'}: ${getSourceLabel(status.source)}`))
  }
  else {
    console.log(
      colors.yellow(
        isZh
          ? '当前 workspace 还没有固定包管理器选择。'
          : 'This workspace does not have a locked package-manager choice yet.',
      ),
    )
  }

  if (status.candidates.length === 0) {
    console.log(
      colors.dim(
        isZh
          ? '当前 workspace 没有检测到明确的 lockfile / workspace 候选。'
          : 'No explicit lockfile or workspace candidates were detected in this workspace.',
      ),
    )
    return
  }

  console.log(colors.bold(isZh ? '候选工具:' : 'Candidate tools:'))
  for (const candidate of status.candidates) {
    const indicators = candidate.indicators.join(', ')
    console.log(`- ${candidate.tool}`)
    console.log(colors.dim(`  ${isZh ? 'root' : 'root'}: ${candidate.root}`))
    console.log(colors.dim(`  ${isZh ? 'indicators' : 'indicators'}: ${indicators}`))
  }
}

export async function resolvePkgTool(options: ResolvePkgToolOptions = {}): Promise<ResolvePkgToolResult> {
  const cwd = normalizeDir(process.cwd())
  const forceChoose = options.forceChoose || isEnabled(process.env.PI_FORCE_PICK_TOOL)
  const forgetPreference = options.forgetPreference || isEnabled(process.env.PI_FORGET_PICK_TOOL)
  const preferredTool = getExplicitPreferredTool(options.preferredTool || process.env.PI_PREFERRED_TOOL)
  const shouldBypassCache = forceChoose || forgetPreference || Boolean(preferredTool)
  const cached = resolvedToolCache.get(cwd)
  if (!shouldBypassCache && cached)
    return cached

  const pending = (async () => {
    const { detected, candidates, rememberedTool } = await preparePkgToolContext(forgetPreference)

    if (preferredTool) {
      if (!validateExplicitPreferredTool(preferredTool, candidates)) {
        logInvalidPreferredTool(preferredTool, candidates)
        process.exit(1)
      }
      const workspaceKey = resolveWorkspaceKey(
        normalizeDir(process.cwd()),
        candidates,
        await readWorkspaceToolPreferences(),
      )
      await writeWorkspaceToolPreference(workspaceKey, preferredTool)
      logWorkspaceToolSelected(preferredTool, true)
      return {
        detected,
        tool: preferredTool,
        source: 'fresh-selection',
      }
    }

    if (!forceChoose && rememberedTool) {
      return {
        detected,
        tool: rememberedTool,
        source: 'saved-preference',
      }
    }

    if (candidates.length <= 1) {
      const fallback = process.env.PI_DEFAULT
      const tool = detected === 'npm' && fallback ? fallback : detected
      if (forceChoose)
        logWorkspaceToolResolved(tool)
      return {
        detected,
        tool,
        source: detected === 'npm' && fallback
          ? 'env-default'
          : candidates.length === 1
            ? 'single-candidate'
            : 'detected-tool',
      }
    }

    const envPreferredTool = getPreferredToolFromEnv(candidates)
    if (!forceChoose && envPreferredTool) {
      return {
        detected,
        tool: envPreferredTool,
        source: 'env-default',
      }
    }

    const cwdForSelection = normalizeDir(process.cwd())
    const selection = await selectToolCandidate(candidates, cwd)
    if (selection.status === 'selected') {
      const workspaceKey = resolveWorkspaceKey(cwdForSelection, candidates, await readWorkspaceToolPreferences())
      await writeWorkspaceToolPreference(workspaceKey, selection.tool)
      logWorkspaceToolSelected(selection.tool, forceChoose)
      return {
        detected,
        tool: selection.tool,
        source: 'fresh-selection',
      }
    }
    if (selection.status === 'cancelled') {
      console.log(colors.dim(isZh ? '已取消' : 'Cancelled'))
      process.exit(0)
    }

    const tool = getDetectedToolFallback(detected, candidates)
    logAmbiguousToolFallback(candidates, tool)
    return {
      detected,
      tool,
      source: 'non-interactive-fallback',
    }
  })()

  resolvedToolCache.set(cwd, pending)
  return pending
}

export function getInstallCommand(tool: PkgTool, hasParams: boolean) {
  const action = hasParams ? 'add' : 'install'
  switch (tool) {
    case 'pnpm':
      return `pnpm ${action}`
    case 'yarn':
      return `yarn ${action}`
    case 'bun':
      return `bun ${action}`
    case 'npm':
      return 'npm install'
    default:
      return `${tool} ${action}`
  }
}

export function getRemoveCommand(tool: PkgTool) {
  switch (tool) {
    case 'pnpm':
      return 'pnpm remove'
    case 'yarn':
      return 'yarn remove'
    case 'bun':
      return 'bun remove'
    case 'npm':
      return 'npm uninstall'
    default:
      return `${tool} remove`
  }
}
