import { SpectralConfig } from "../configuration/spectral-config";
import { LoggerService } from "./logger-service";
import Mixpanel from 'mixpanel'

export class AnalyticsService {
  private static mixpanel: Mixpanel.Mixpanel
  static async init(spectralConfig: SpectralConfig): Promise<void> {
    const logger = LoggerService.getInstance()
    try {
      if (!spectralConfig.mixPanelKey) {
        logger.warn('Analytics service not initialized - key not provided')
        return
      }

      this.mixpanel = Mixpanel.init(spectralConfig.mixPanelKey)
    } catch (error) {
      logger.warn(`Analytics service not initialized - ${error}`)
    }
  }

  static track(eventName: string, eventProperties: any = null): void {
    const logger = LoggerService.getInstance()
    try {
      this.mixpanel.track(eventName, eventProperties)
    } catch (error) {
      logger.warn(`Analytics service event not tracked - ${error}`)
    }
  }
}