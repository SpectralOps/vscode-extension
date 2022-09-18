import { FindingSeverity, FindingType } from './constants'

export type LogLevel = 'Info' | 'Warn' | 'Error' | 'Debug'
export type Findings = Record<FindingType, FindingsTypeResults>

export type FindingsTypeResults = Record<string, Array<ScanFinding>>

export type FindingsAggregations = {
  secret: number
  iac: number
}

export type ScanResult = {
  items: Array<ScanFinding>
}

export interface ScanFinding {
  finding: string
  rule: Rule
  position: FindingPosition
  metadata: FindingMetadata
}

export interface ScanFindingView extends ScanFinding {
  rootPath: string
}

type FindingMetadata = {
  tags: Array<string>
}

export type Rule = {
  id: string
  name: string
  description: string
  severity: FindingSeverity
}

type FindingPosition = {
  start: Array<number>
  end: Array<number>
}
