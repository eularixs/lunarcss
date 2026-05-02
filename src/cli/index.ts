#!/usr/bin/env node
// `lunar-css` CLI — entry point. Binary is `lunar-css` (not `lunar`) to avoid
// colliding with the Lunar Kit CLI.

import { detectProject } from './detect.js'
import { runInitExpo } from './init-expo.js'
import { runInitBare } from './init-bare.js'
import { runInitNextjs } from './init-nextjs.js'
import type { InitStep } from './init-shared.js'

const VERSION = '0.0.0'

const HELP = `lunar-css ${VERSION}

Usage:
  lunar-css init [--dry-run]   Detect project type and configure LunarCSS
  lunar-css --help             Show this message
  lunar-css --version          Print version

Supported targets: expo · rn-bare · nextjs
`

interface Report {
  steps: InitStep[]
  warnings: string[]
}

function printReport(report: Report): void {
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

  console.log(`[lunar-css] Detected project: ${detect.kind}`)
  if (detect.expoSdkVersion !== null) {
    console.log(`[lunar-css] Expo SDK: ${detect.expoSdkVersion}`)
  }
  for (const note of detect.notes) {
    console.log(`[lunar-css] Note: ${note}`)
  }

  let report: Report | null = null
  if (detect.kind === 'expo') {
    report = runInitExpo({ projectRoot, dryRun })
  } else if (detect.kind === 'rn-bare') {
    report = runInitBare({ projectRoot, dryRun })
  } else if (detect.kind === 'nextjs') {
    report = runInitNextjs({ projectRoot, dryRun })
  } else {
    console.error('[lunar-css] Could not detect Expo / Next.js / RN Bare in this project.')
    return 1
  }

  if (dryRun) console.log('[lunar-css] Dry run — no files written.')
  printReport(report)
  return 0
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
  console.error(`[lunar-css] Unknown command: "${cmd}"`)
  console.error(HELP)
  return 1
}

const code = main(process.argv.slice(2))
process.exit(code)
