import { SCAN_STATE } from '../common/constants'
import { setContext } from '../common/vs-code'

export class ContextService {
  private readonly viewContext: { [key: string]: any }
  private static instance: ContextService
  constructor() {
    this.viewContext = {}
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new ContextService()
    }

    return this.instance
  }

  public getContext(key: string): any {
    return this.viewContext[key]
  }

  public setContext(key: string, value: any): void {
    this.viewContext[key] = value
    setContext(key, value)
  }

  get scanState(): string {
    return this.viewContext[SCAN_STATE]
  }
}
