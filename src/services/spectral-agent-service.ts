import { spawn } from 'child_process'
import { readFileSync, unlinkSync } from 'fs'
import isEmpty from 'lodash/isEmpty'
import path from 'path'
import {
  AGENT_LAST_UPDATE_DATE,
  FindingSeverity,
  FindingType,
  severityMapping,
  SPECTRAL_BASE_URL,
  SPECTRAL_DSN,
  SPECTRAL_FOLDER,
} from '../common/constants'
import {
  Findings,
  FindingsAggregations,
  ScanFindingView,
  ScanResult,
} from '../common/types'
import { formatWindowsPath, isWindows } from '../common/utils'
import SecretStorageService from './secret-storage-service'
import { ExtensionContext } from '../common/extension-context'
import { setupSpectral } from '../spectral/commands'

export class SpectralAgentService {
  public findings: Findings
  public findingsAggregations: FindingsAggregations
  private readonly extensionContext: ExtensionContext

  constructor() {
    this.resetFindings()
    this.extensionContext = ExtensionContext.getInstance()
  }

  public installSpectral(): Promise<any> {
    return new Promise((resolve, reject) => {
      let child
      let command
      if (isWindows()) {
        command = `iwr ${SPECTRAL_BASE_URL}/latest/ps1 -useb | iex`
        child = spawn('powershell.exe', [command])
      } else {
        command = `curl -L '${SPECTRAL_BASE_URL}/latest/x/sh' | sh`
        child = spawn('/bin/sh', ['-c', command])
      }

      child.stderr.setEncoding('utf8')
      const stdOut: string[] = []
      const stderrChunks: string[] = []
      child.stdout.on('data', (data) => {
        stdOut.push(data.toString('utf8'))
      })
      child.stderr.on('data', (chunk) => {
        return stderrChunks.push(chunk)
      })
      child.on('error', async (err) => {
        reject(err)
      })
      child.on('close', (code) => {
        if (!isEmpty(stderrChunks) && code !== 0) {
          const error = stderrChunks.join('')
          return reject(error)
        }
        return resolve('')
      })
    })
  }

  public async updateSpectral(): Promise<any> {
    if (this.isOneWeekPassedSinceLastUpdate()) {
      await setupSpectral(this)
    }
  }

  public checkForSpectralBinary(): Promise<Boolean> {
    return new Promise((resolve) => {
      const child = spawn(this.getSpectralPath(), ['--nobanners', 'version'], {
        cwd: process.env.home,
      })
      child.on('error', () => {
        resolve(false)
      })
      child.on('close', (code) => {
        return resolve(code === 0)
      })
    })
  }

  public scan(scanPath: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const dsn = await SecretStorageService.getInstance().get(SPECTRAL_DSN)
      const outputFileName = 'output.txt'
      const spectralArgs = [
        '--nobanners',
        'scan',
        '--include-tags',
        'base,iac',
        '--nosend',
        '--internal-output',
        outputFileName,
      ]
      const options: any = {
        cwd: scanPath,
      }
      if (isWindows()) {
        spectralArgs.push('--dsn', dsn)
      } else {
        options.env = { ...process.env, [SPECTRAL_DSN]: dsn }
      }

      const child = spawn(this.getSpectralPath(), spectralArgs, options)

      child.stderr.setEncoding('utf8')
      const stderrChunks: string[] = []
      const stdOut: string[] = []
      child.stdout.on('data', (data) => {
        stdOut.push(data.toString('utf8'))
      })
      child.stderr.on('data', (chunk) => {
        return stderrChunks.push(chunk)
      })
      child.on('error', async (err) => {
        return reject(err)
      })
      child.on('close', async () => {
        if (!isEmpty(stderrChunks)) {
          const agentError = stderrChunks.join('')
          return reject(agentError)
        }
        try {
          const filePath = path.join(scanPath, outputFileName)
          const result = readFileSync(filePath, { encoding: 'utf8' })
          unlinkSync(filePath)
          const jsonOutput = JSON.parse(result)
          return resolve(jsonOutput)
        } catch (err) {
          return reject(err)
        }
      })
    })
  }

  public processResults(results: ScanResult, folderPath: string) {
    results?.items?.forEach((item: ScanFindingView) => {
      this.processFindingItem({ item, folderPath: folderPath.toLowerCase() })
    })
  }

  public resetFindings() {
    this.findings = Object.values(FindingType).reduce((acc, key) => {
      acc[key] = {}
      return acc
    }, {} as Findings)
    this.findingsAggregations = Object.values(FindingType).reduce(
      (acc, key) => {
        acc[key] = 0
        return acc
      },
      {} as FindingsAggregations
    )
  }

  private processFindingItem({
    item,
    folderPath,
  }: {
    item: ScanFindingView
    folderPath: string
  }): void {
    item.rootPath = folderPath

    if (isWindows()) {
      item.rootPath = formatWindowsPath(folderPath)
      item.finding = formatWindowsPath(item.finding.replace('\\\\?\\', ''))
    }

    item.rule.severity = this.mapToNewSeverity(item.rule.severity)
    item.finding = item.finding.toLowerCase()
    this.findingsAggregations[item.rule.severity] += 1
    const isIac = item.metadata.tags.includes(FindingType.iac)
    let findingTypeResults
    if (isIac) {
      findingTypeResults = this.findings[FindingType.iac]
      this.findingsAggregations[FindingType.iac] += 1
    } else {
      findingTypeResults = this.findings[FindingType.secret]
      this.findingsAggregations[FindingType.secret] += 1
    }

    if (!findingTypeResults[item.finding]) {
      findingTypeResults[item.finding] = []
    }

    findingTypeResults[item.finding].push(item)
  }

  private getSpectralPath(): string {
    if (isWindows()) {
      return 'spectral'
    }

    return `${SPECTRAL_FOLDER}/spectral`
  }

  private mapToNewSeverity(itemSeverity: FindingSeverity): FindingSeverity {
    if (severityMapping[itemSeverity]) {
      return severityMapping[itemSeverity]
    } else {
      return itemSeverity
    }
  }

  private getLastAgentUpdateDate(): number | undefined {
    return this.extensionContext.getGlobalStateValue<number>(
      AGENT_LAST_UPDATE_DATE
    )
  }

  private isOneWeekPassedSinceLastUpdate(): boolean {
    const lastUpdateDate = this.getLastAgentUpdateDate()
    if (!lastUpdateDate) {
      return true
    }
    const oneWeekInMs = 7 * 24 * 3600 * 1000
    if (Date.now() - lastUpdateDate > oneWeekInMs) {
      return true
    }
    return false
  }
}
