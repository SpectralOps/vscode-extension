import { ConfigurationChangeEvent, WorkspaceConfiguration } from 'vscode'
import { ScanEngine } from './constants'

export const CONFIGURATION_IDENTIFIER = 'spectral'
export const USE_IAC_ENGINE_SETTING = 'scan.engines.useIacEngine'
export const USE_OSS_ENGINE_SETTING = 'scan.engines.useOssEngine'
export const USE_SECRET_ENGINE_SETTING = 'scan.engines.useSecretsEngine'
export const INCLUDE_TAGS_SETTING = 'scan.includeTags'

const prefixIdentifier = (settings: Array<string>) =>
  settings.map((setting) => `${CONFIGURATION_IDENTIFIER}.${setting}`)

export class Configuration {
  private extensionConfig: WorkspaceConfiguration
  static instance: Configuration
  constructor(workspace) {
    this.extensionConfig = workspace.getConfiguration(CONFIGURATION_IDENTIFIER)
    workspace.onDidChangeConfiguration(
      async (event: ConfigurationChangeEvent): Promise<void> => {
        const changed = prefixIdentifier([
          USE_SECRET_ENGINE_SETTING,
          USE_IAC_ENGINE_SETTING,
          INCLUDE_TAGS_SETTING,
        ]).find((setting) => event.affectsConfiguration(setting))
        if (changed) {
          this.extensionConfig = workspace.getConfiguration(
            CONFIGURATION_IDENTIFIER
          )
        }
      }
    )
  }

  public static getInstance(workspace?) {
    if (!this.instance) {
      this.instance = new Configuration(workspace)
    }
    return this.instance
  }

  get engines() {
    const engines = []
    const useSecretsEngine = this.extensionConfig.get<boolean>(
      USE_SECRET_ENGINE_SETTING,
      true
    )
    if (useSecretsEngine) {
      engines.push(ScanEngine.secrets)
    }
    const useIacEngine = this.extensionConfig.get<boolean>(
      USE_IAC_ENGINE_SETTING,
      true
    )
    if (useIacEngine) {
      engines.push(ScanEngine.iac)
    }
    const useOssEngine = this.extensionConfig.get<boolean>(
      USE_OSS_ENGINE_SETTING,
      true
    )
    if (useOssEngine) {
      engines.push(ScanEngine.oss)
    }
    return engines.join(',')
  }

  get includeTags() {
    return this.extensionConfig
      .get<Array<string>>(INCLUDE_TAGS_SETTING, [])
      .join(',')
  }
}
