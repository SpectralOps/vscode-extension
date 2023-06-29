import { ContextService } from '../services/context-service'
import { SpectralAgentService } from '../services/spectral-agent-service'
import { updateFindingsDecorations } from './results-view-decorations'
import {
  AGENT_LAST_UPDATE_DATE,
  HAS_DSN,
  HAS_SPECTRAL_INSTALLED,
  PRE_SCAN,
  SCAN_STATE,
} from '../common/constants'
import { SPECTRAL_VIEW_SECRETS } from '../common/constants'
import {
  createStatusBarItem,
  getActiveTextEditor,
  runWithLoaderOnView,
  showInputBox,
  ShowNotificationMessage,
} from '../common/vs-code'
import { ScanResult } from '../common/types'
import { ScanState, SPECTRAL_DSN } from '../common/constants'
import { LoggerService } from '../services/logger-service'
import { ResultsView } from './results-view'
import SecretStorageService from '../services/secret-storage-service'
import { AnalyticsService } from '../services/analytics-service'
import { ExtensionContext } from '../common/extension-context'

export const setDsn = () => {
  showInputBox(
    {
      password: true,
      placeHolder: 'https://spu-XXXXXXXXXXXXX@XXXXXX',
      title: 'Spectral DSN',
    },
    storeDsn,
    (value: string) => {
      const regex =
        /^https:\/\/spu-[a-zA-Z0-9]{32}@([a-zA-Z0-9_-]+\.)+[a-zA-Z]+$/
      return regex.test(value)
    },
    'DSN structure is invalid'
  )
}

export const scanWorkSpaceFolders = async ({
  foldersPath,
  spectralAgentService,
  resultsView,
}: {
  foldersPath: Array<string>
  spectralAgentService: SpectralAgentService
  resultsView: ResultsView
}): Promise<any> => {
  const contextService = ContextService.getInstance()
  const logger = LoggerService.getInstance()
  const inProgressStatusBarItem = createStatusBarItem({
    location: 'right',
    priority: 1,
    text: `$(loading~spin)`,
    tooltip: 'Spectral is scanning',
  })
  await contextService.setContext(SCAN_STATE, ScanState.inProgress)
  logger.debug('Scan start')
  AnalyticsService.track('vscode-scan')
  inProgressStatusBarItem.show()
  try {
    spectralAgentService.resetFindings()
    await runWithLoaderOnView({
      viewId: SPECTRAL_VIEW_SECRETS,
      action: () =>
        scanWorkspaces({ spectralAgentService, foldersPath, logger }),
    })
  } catch (error) {
    await contextService.setContext(SCAN_STATE, 'failed')
    inProgressStatusBarItem.dispose()
    logger.error(error)
    ShowNotificationMessage({
      messageType: 'error',
      messageText: `Scan failed`,
      items: ['See output'],
    }).then(() => logger.showOutput())
    return
  }

  await contextService.setContext(SCAN_STATE, ScanState.success)
  logger.debug('Scan finished')
  await contextService.setContext(PRE_SCAN, false)

  inProgressStatusBarItem.dispose()

  resultsView.refresh({
    findings: spectralAgentService.findings,
    findingsAggregations: spectralAgentService.findingsAggregations,
  })

  updateFindingsDecorations(
    getActiveTextEditor(),
    spectralAgentService.findings
  )
}

export const setupSpectral = async (
  spectralAgentService: SpectralAgentService
): Promise<void> => {
  const inProgressStatusBarItem = createStatusBarItem({
    location: 'right',
    priority: 1,
    text: `$(loading~spin)`,
    tooltip: 'Installing Spectral',
  })
  try {
    inProgressStatusBarItem.show()
    await spectralAgentService.installSpectral()
    inProgressStatusBarItem.dispose()
    const contextService = ContextService.getInstance()
    await contextService.setContext(HAS_SPECTRAL_INSTALLED, true)
    const extensionContext = ExtensionContext.getInstance()
    extensionContext.updateGlobalStateValue(AGENT_LAST_UPDATE_DATE, Date.now())
  } catch (error) {
    inProgressStatusBarItem.dispose()
    const logger = LoggerService.getInstance()
    logger.error(error)
    ShowNotificationMessage({
      messageType: 'error',
      messageText: `Spectral installation failed`,
      items: ['See output'],
    }).then(() => logger.showOutput())
  }
}

const scanWorkspaces = async ({
  spectralAgentService,
  foldersPath,
  logger,
}: {
  spectralAgentService: SpectralAgentService
  foldersPath: Array<string>
  logger: LoggerService
}) => {
  await Promise.all(
    foldersPath.map(async (folderPath) => {
      logger.debug(`Scanning workspace folder: ${folderPath}`)
      const results: ScanResult = await spectralAgentService.scan(folderPath)
      logger.debug(`Found: ${results.items.length} findings`)
      spectralAgentService.processResults(results, folderPath)
    })
  )
}

const storeDsn = async (dsn: string): Promise<void> => {
  const secretStorageService = SecretStorageService.getInstance()
  await secretStorageService.store(SPECTRAL_DSN, dsn)
  const contextService = ContextService.getInstance()
  await contextService.setContext(HAS_DSN, true)
}
