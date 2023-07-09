import {
  ExtensionContext,
  commands,
  window,
  workspace,
  WorkspaceFoldersChangeEvent,
  TextEditor,
  ConfigurationChangeEvent,
} from 'vscode'
import {
  ENABLE_INSTALL_AGENT,
  SPECTRAL_INSTALL,
  CONFIGURATION_IDENTIFIER,
  INCLUDE_TAGS_SETTING,
  SPECTRAL_SCAN,
  SPECTRAL_SET_DSN,
  SPECTRAL_SHOW_OUTPUT,
  USE_IAC_ENGINE_SETTING,
  USE_OSS_ENGINE_SETTING,
  USE_SECRET_ENGINE_SETTING,
} from '../common/constants'
import {
  HAS_DSN,
  PRE_SCAN,
  HAS_SPECTRAL_INSTALLED,
  HAS_LICENSE,
} from '../common/constants'
import { ContextService } from '../services/context-service'
import { SpectralAgentService } from '../services/spectral-agent-service'
import { scanWorkSpaceFolders, setDsn, setupSpectral } from './commands'
import concat from 'lodash/concat'
import pullAll from 'lodash/pullAll'
import { updateFindingsDecorations } from './results-view-decorations'
import { SPECTRAL_DSN, SPECTRAL_FOLDER } from '../common/constants'
import { accessSync } from 'fs'
import path from 'path'
import { LoggerService } from '../services/logger-service'
import { ResultsView } from './results-view'
import SecretStorageService from '../services/secret-storage-service'
import { getWorkspaceFolders } from '../common/vs-code'
import { AnalyticsService } from '../services/analytics-service'
import { PersistenceContext } from '../common/persistence-context'
import { Configuration } from '../common/configuration'
import { isOneWeekPassedSinceLastUpdate } from '../common/spectral-utils'

export class SpectralExtension {
  private workspaceFolders: Array<string> = getWorkspaceFolders()
  private readonly contextService: ContextService
  private readonly persistenceContext: PersistenceContext
  private readonly logger: LoggerService
  private readonly configuration: Configuration
  private readonly spectralAgentService: SpectralAgentService
  private readonly resultsView: ResultsView

  constructor() {
    this.contextService = ContextService.getInstance()
    this.logger = LoggerService.getInstance()
    this.persistenceContext = PersistenceContext.getInstance()
    this.configuration = Configuration.getInstance(workspace)
    this.spectralAgentService = new SpectralAgentService()
    this.resultsView = new ResultsView()
  }

  public async activate(vsCodeContext: ExtensionContext): Promise<void> {
    try {
      this.persistenceContext.setContext(vsCodeContext)
      this.initializeExtension(vsCodeContext)
      const isSpectralInstalled =
        await this.spectralAgentService.checkForSpectralBinary()
      if (isSpectralInstalled && isOneWeekPassedSinceLastUpdate()) {
        await setupSpectral(this.spectralAgentService)
      }
      this.setSpectralInstallationContext(isSpectralInstalled)
      AnalyticsService.init()
    } catch (error) {
      this.logger.error(error)
    }
  }

  private async initializeExtension(
    vsCodeContext: ExtensionContext
  ): Promise<void> {
    SecretStorageService.init(vsCodeContext)
    this.contextService.setContext(PRE_SCAN, true)
    this.registerCommands(vsCodeContext)
    this.registerEvents()
  }

  public async setSpectralInstallationContext(
    isSpectralInstalled: Boolean
  ): Promise<void> {
    if (!isSpectralInstalled) {
      this.contextService.setContext(HAS_SPECTRAL_INSTALLED, false)
      this.contextService.setContext(ENABLE_INSTALL_AGENT, true)
      return
    }
    this.contextService.setContext(HAS_SPECTRAL_INSTALLED, true)
    const secretStorageService = SecretStorageService.getInstance()
    const dsn = await secretStorageService.get(SPECTRAL_DSN)
    if (!dsn) {
      this.contextService.setContext(HAS_DSN, false)
    } else {
      this.contextService.setContext(HAS_DSN, true)
    }
    try {
      accessSync(path.join(`${SPECTRAL_FOLDER}/license`))
      this.contextService.setContext(HAS_LICENSE, true)
    } catch (error) {
      this.contextService.setContext(HAS_LICENSE, false)
    }
  }

  private registerCommands(vsCodeContext: ExtensionContext): void {
    vsCodeContext.subscriptions.push(
      commands.registerCommand(SPECTRAL_INSTALL, () =>
        setupSpectral(this.spectralAgentService)
      ),
      commands.registerCommand(SPECTRAL_SCAN, () =>
        scanWorkSpaceFolders({
          foldersPath: this.workspaceFolders,
          spectralAgentService: this.spectralAgentService,
          resultsView: this.resultsView,
        })
      ),
      commands.registerCommand(SPECTRAL_SHOW_OUTPUT, () =>
        this.logger.showOutput()
      ),
      commands.registerCommand(SPECTRAL_SET_DSN, async () => {
        setDsn()
      })
    )
  }

  private registerEvents(): void {
    workspace.onDidChangeWorkspaceFolders(
      (workspaceFoldersChangeEvent: WorkspaceFoldersChangeEvent) => {
        this.workspaceFolders = concat(
          this.workspaceFolders,
          workspaceFoldersChangeEvent.added.map((folder) => folder.uri.path)
        )
        pullAll(
          this.workspaceFolders,
          workspaceFoldersChangeEvent.removed.map((folder) => folder.uri.path)
        )
      }
    )
    window.onDidChangeActiveTextEditor((event: TextEditor | undefined) => {
      updateFindingsDecorations(event, this.spectralAgentService.findings)
    })
    workspace.onDidChangeConfiguration(
      async (event: ConfigurationChangeEvent): Promise<void> => {
        const changed = [
          `${CONFIGURATION_IDENTIFIER}.${USE_SECRET_ENGINE_SETTING}`,
          `${CONFIGURATION_IDENTIFIER}.${USE_IAC_ENGINE_SETTING}`,
          `${CONFIGURATION_IDENTIFIER}.${USE_OSS_ENGINE_SETTING}`,
          `${CONFIGURATION_IDENTIFIER}.${INCLUDE_TAGS_SETTING}`,
        ].find((setting) => event.affectsConfiguration(setting))
        if (changed) {
          workspace.getConfiguration(CONFIGURATION_IDENTIFIER)
          this.configuration.updateConfiguration(workspace)
        }
      }
    )
  }
}
