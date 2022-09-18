import { ContextService } from '../services/context-service'
import { SpectralAgentService } from '../services/spectral-agent-service'
import { updateFindingsDecorations } from './results-view-decorations'
import { HAS_DSN, PRE_SCAN, SCAN_STATE } from '../common/constants'
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

export const setDsn = () => {
  showInputBox(
    {
      password: true,
      placeHolder: 'https://spu-XXXXXXXXXXXXX@XXXXXX',
      title: 'Spectral DSN',
    },
    storeDsn
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
  inProgressStatusBarItem.show()
  try {
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
