import * as vscode from 'vscode'
import { SpectralExtension } from './spectral/extension'

const extension = new SpectralExtension()

export function activate(context: vscode.ExtensionContext): void {
  console.log('Activating Spectral extension')
  extension.activate(context)
}
export function deactivate(): void {
  console.log('Deactivating Spectral extension')
}
