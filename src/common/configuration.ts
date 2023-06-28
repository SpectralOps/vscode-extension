import { WorkspaceConfiguration } from 'vscode'
import {
  CONFIGURATION_IDENTIFIER,
  INCLUDE_TAGS_SETTING,
  ScanEngine,
  USE_IAC_ENGINE_SETTING,
  USE_OSS_ENGINE_SETTING,
  USE_SECRET_ENGINE_SETTING,
} from './constants'

export class Configuration {
  private extensionConfig: WorkspaceConfiguration
  static instance: Configuration
  constructor(workspace) {
    this.extensionConfig = workspace.getConfiguration(CONFIGURATION_IDENTIFIER)
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
      USE_SECRET_ENGINE_SETTING
    )
    if (useSecretsEngine) {
      engines.push(ScanEngine.secrets)
    }
    const useIacEngine = this.extensionConfig.get<boolean>(
      USE_IAC_ENGINE_SETTING
    )
    if (useIacEngine) {
      engines.push(ScanEngine.iac)
    }
    const useOssEngine = this.extensionConfig.get<boolean>(
      USE_OSS_ENGINE_SETTING
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

  public updateConfiguration = (workspace) => {
    const extensionConfig = workspace.getConfiguration(CONFIGURATION_IDENTIFIER)
    this.extensionConfig = extensionConfig
  }
}
