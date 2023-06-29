import * as vscode from 'vscode'

export class ExtensionContext {
  private context?: vscode.ExtensionContext
  private static instance: ExtensionContext

  public static getInstance() {
    if (!this.instance) {
      this.instance = new ExtensionContext()
    }

    return this.instance
  }

  setContext(context: vscode.ExtensionContext): void {
    this.context = context
  }

  getGlobalStateValue<T>(key: string): T | undefined {
    return this.acquireContext().globalState.get(key)
  }

  updateGlobalStateValue(key: string, value: unknown): Thenable<void> {
    return this.acquireContext().globalState.update(key, value)
  }

  private acquireContext(): vscode.ExtensionContext {
    if (!this.context) throw new Error('VS Code extension context not set.')
    return this.context
  }
}
