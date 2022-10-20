import { LoggerService } from "./logger-service";
import Mixpanel from 'mixpanel'
import spectralConfig from '../spectral.config.json'

export class AnalyticsService {
  private static mixpanel: Mixpanel.Mixpanel
  static init(): void {
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