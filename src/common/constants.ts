export const SPECTRAL_SCAN = 'spectral.scan'
export const SPECTRAL_INSTALL = 'spectral.install'
export const SPECTRAL_SHOW_OUTPUT = 'spectral.showOutput'
export const SPECTRAL_SET_DSN = 'spectral.setDsn'
export const CONTEXT_PREFIX = 'spectral:'
export const HAS_SPECTRAL_INSTALLED = 'hasSpectralInstalled'
export const HAS_DSN = 'hasDsn'
export const HAS_LICENSE = 'hasLicense'
export const SCAN_STATE = 'scanState'
export const ENABLE_INSTALL_AGENT = 'enableInstallAgent'
export const PRE_SCAN = 'preScan'
export const SPECTRAL_VIEW_SECRETS = 'spectral.views.secrets'
export const SPECTRAL_VIEW_IAC = 'spectral.views.iac'
export const SPECTRAL_VIEW_OSS = 'spectral.views.oss'

export enum ScanState {
  preScan = 'preScan',
  inProgress = 'inProgress',
  success = 'success',
  failed = 'failed',
}

export enum FindingSeverity {
  error = 'error',
  warning = 'warning',
  info = 'info',
  critical = 'critical',
  high = 'high',
  medium = 'medium',
  low = 'low',
  informational = 'informational',
}

export enum FindingSeverityLevel {
  critical = 1,
  high = 2,
  medium = 3,
  low = 4,
  informational = 5,
}

export enum FindingType {
  secret = 'secret',
  iac = 'iac',
  oss = 'oss',
}

export enum ScanEngine {
  secrets = 'secrets',
  iac = 'iac',
  oss = 'oss',
}

export const severityMapping = {
  [FindingSeverity.error]: FindingSeverity.high,
  [FindingSeverity.warning]: FindingSeverity.medium,
  [FindingSeverity.info]: FindingSeverity.informational,
}

export const SPECTRAL_FOLDER = `${process.env.HOME}/.spectral`
export const SPECTRAL_DSN = 'SPECTRAL_DSN'
export const FINDING_POSITION_LINE_INDEX = 0
export const FINDING_POSITION_COL_INDEX = 1
export const SPECTRAL_BASE_URL = 'https://get.spectralops.io'
export const PLAYBOOKS_URL = `${SPECTRAL_BASE_URL}/api/v1/issues/playbooks`
export const AGENT_LAST_UPDATE_DATE = 'spectral.agentLastUpdateDate'
export const CONFIGURATION_IDENTIFIER = 'spectral'
export const USE_IAC_ENGINE_SETTING = 'scan.engines.useIacEngine'
export const USE_OSS_ENGINE_SETTING = 'scan.engines.useOssEngine'
export const USE_SECRET_ENGINE_SETTING = 'scan.engines.useSecretsEngine'
export const INCLUDE_TAGS_SETTING = 'scan.includeTags'
