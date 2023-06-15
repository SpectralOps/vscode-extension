import { spawn } from 'child_process'
import { readFileSync, unlinkSync } from 'fs'
import isEmpty from 'lodash/isEmpty'
import path from 'path'
import {
  FindingSeverity,
  FindingType,
  severityMapping,
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
import { Configuration } from '../common/configuration'

export class SpectralAgentService {
  public findings: Findings
  public findingsAggregations: FindingsAggregations

  constructor() {
    this.resetFindings()
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
        '--nosend',
        '--ok',
        '--internal-output',
        outputFileName,
      ]
      const options: any = {
        cwd: scanPath,
      }
      const engines = Configuration.getInstance().engines
      if (!isEmpty(engines)) {
        spectralArgs.push('--engines', engines)
      }
      const tags = Configuration.getInstance().includeTags
      if (!isEmpty(tags)) {
        spectralArgs.push('--include-tags', tags)
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
      child.on('close', async (code) => {
        if (!isEmpty(stderrChunks)) {
          const agentError = stderrChunks.join('')
          return reject(agentError)
        }
        if (code === 0) {
          try {
            const filePath = path.join(scanPath, outputFileName)
            const result = readFileSync(filePath, { encoding: 'utf8' })
            unlinkSync(filePath)
            const jsonOutput = JSON.parse(result)
            return resolve(jsonOutput)
          } catch (err) {
            return reject(err)
          }
        } else {
          return reject()
        }
      })
    })
  }

  public processResults(results: ScanResult, folderPath: string) {
    this.resetFindings()
    results?.items?.forEach((item: ScanFindingView) => {
      this.processFindingItem({ item, folderPath: folderPath.toLowerCase() })
    })
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

  private resetFindings() {
    this.findings = { [FindingType.iac]: {}, [FindingType.secret]: {} }
    this.findingsAggregations = {
      [FindingType.secret]: 0,
      [FindingType.iac]: 0,
    }
  }

  private mapToNewSeverity(itemSeverity: FindingSeverity): FindingSeverity {
    if (severityMapping[itemSeverity]) {
      return severityMapping[itemSeverity]
    } else {
      return itemSeverity
    }
  }
}
