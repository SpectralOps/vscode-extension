import { OutputChannel, window } from 'vscode'
import { LogLevel } from '../common/types'

export class LoggerService {
  private output: OutputChannel
  private static instance: LoggerService

  public static getInstance() {
    if (!this.instance) {
      this.instance = new LoggerService()
    }

    return this.instance
  }

  constructor() {
    this.output = window.createOutputChannel('Spectral')
  }

  info(message: string): void {
    this.log('Info', message)
  }

  warn(message: string): void {
    this.log('Warn', message)
  }

  error(message: string): void {
    this.log('Error', message)
  }

  debug(message: string): void {
    this.log('Debug', message)
  }

  log(level: LogLevel, message: string): void {
    if (level == 'Debug') {
      return console.log(message)
    }

    this.output.appendLine(`[${level}] ${message}`)
  }

  showOutput() {
    this.output.show()
  }
}
