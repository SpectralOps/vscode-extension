import { SecretStorage, ExtensionContext } from 'vscode'

export default class SecretStorageService {
  private static instance: SecretStorageService
  constructor(private secretStorage: SecretStorage) {}
  static init(context: ExtensionContext): void {
    SecretStorageService.instance = new SecretStorageService(context.secrets)
  }

  static getInstance(): SecretStorageService {
    return SecretStorageService.instance
  }

  get(key: string): Promise<string | undefined> {
    return this.secretStorage.get(key) as Promise<string | undefined>
  }

  store(key: string, value: string): void {
    this.secretStorage.store(key, value) as Promise<void>
  }

  delete(key: string): Promise<void> {
    return this.secretStorage.delete(key) as Promise<void>
  }
}
