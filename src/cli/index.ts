#!/usr/bin/env node
// `lunarcss` CLI — entry point. Binary is `lunarcss` (not `lunar`) to avoid
// colliding with the Lunar Kit CLI.

import { detectProject } from './detect.js'
import { runInitExpo, type InitExpoReport } from './init-expo.js'

const VERSION = '0.0.0'

const HELP = `lunarcss ${VERSION}

Usage:
  lunarcss init [--dry-run]   Detect project type and configure LunarCSS
  lunarcss --help             Show this message
  lunarcss --version          Print version

Currently supported targets:
  expo        ✅
  rn-bare     ⏳ pending
  nextjs      ⏳ pending
`

function printReport(report: InitExpoReport): void {
  for (const step of report.steps) {
    const symbol =
      step.result.status === 'created'
        ? '+'
        : step.result.status === 'updated'
          ? '~'
          : step.result.status === 'unchanged'
            ? '='
            : 's'
    console.log(`  [${symbol}] ${step.label.padEnd(20)} ${step.result.status}`)
  }
  if (report.warnings.length) {
    console.log('')
    for (const w of report.warnings) console.log(`  ! ${w}`)
  }
}

function runInit(args: readonly string[]): number {
  const dryRun = args.includes('--dry-run')
  const projectRoot = process.cwd()
  const detect = detectProject(projectRoot)

  console.log(`[lunarcss] Detected project: ${detect.kind}`)
  if (detect.expoSdkVersion !== null) {
    console.log(`[lunarcss] Expo SDK: ${detect.expoSdkVersion}`)
  }
  for (const note of detect.notes) {
    console.log(`[lunarcss] Note: ${note}`)
  }

  if (detect.kind === 'expo') {
    const report = runInitExpo({ projectRoot, dryRun })
    if (dryRun) console.log('[lunarcss] Dry run — no files written.')
    printReport(report)
    return 0
  }

  if (detect.kind === 'unknown') {
    console.error('[lunarcss] Could not detect Expo / Next.js / RN Bare in this project.')
    return 1
  }

  console.error(`[lunarcss] \`init\` for ${detect.kind} is not yet implemented.`)
  return 1
}

function main(argv: readonly string[]): number {
  const cmd = argv[0]
  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    console.log(HELP)
    return 0
  }
  if (cmd === '--version' || cmd === '-v') {
    console.log(VERSION)
    return 0
  }
  if (cmd === 'init') {
    return runInit(argv.slice(1))
  }
  console.error(`[lunarcss] Unknown command: "${cmd}"`)
  console.error(HELP)
  return 1
}

const code = main(process.argv.slice(2))
process.exit(code)
