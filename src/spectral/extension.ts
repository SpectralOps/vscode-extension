import {
  ExtensionContext,
  commands,
  window,
  workspace,
  WorkspaceFoldersChangeEvent,
  TextEditor,
} from 'vscode'
import {
  SPECTRAL_SCAN,
  SPECTRAL_SET_DSN,
  SPECTRAL_SHOW_OUTPUT,
} from '../common/constants'
import {
  HAS_DSN,
  PRE_SCAN,
  HAS_SPECTRAL_INSTALLED,
  HAS_LICENSE,
} from '../common/constants'
import { ContextService } from '../services/context-service'
import { SpectralAgentService } from '../services/spectral-agent-service'
import { scanWorkSpaceFolders, setDsn } from './commands'
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
import { Configuration } from '../common/configuration'

export class SpectralExtension {
  private workspaceFolders: Array<string> = getWorkspaceFolders()
  private readonly contextService: ContextService
  private readonly logger: LoggerService
  private readonly spectralAgentService: SpectralAgentService
  private readonly resultsView: ResultsView

  constructor() {
    this.contextService = ContextService.getInstance()
    this.logger = LoggerService.getInstance()
    Configuration.getInstance(workspace)
    this.spectralAgentService = new SpectralAgentService()
    this.resultsView = new ResultsView()
  }

  public async activate(vsCodeContext: ExtensionContext): Promise<void> {
    try {
      this.initializeExtension(vsCodeContext)
      const isSpectralInstalled =
        await this.spectralAgentService.checkForSpectralBinary()
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
      await this.contextService.setContext(HAS_SPECTRAL_INSTALLED, false)
      return
    }
    await this.contextService.setContext(HAS_SPECTRAL_INSTALLED, true)
    const secretStorageService = SecretStorageService.getInstance()
    const dsn = await secretStorageService.get(SPECTRAL_DSN)
    if (!dsn) {
      await this.contextService.setContext(HAS_DSN, false)
    } else {
      await this.contextService.setContext(HAS_DSN, true)
    }
    try {
      accessSync(path.join(`${SPECTRAL_FOLDER}/license`))
      await this.contextService.setContext(HAS_LICENSE, true)
    } catch (error) {
      await this.contextService.setContext(HAS_LICENSE, false)
    }
  }

  private registerCommands(vsCodeContext: ExtensionContext): void {
    vsCodeContext.subscriptions.push(
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
  }
}
