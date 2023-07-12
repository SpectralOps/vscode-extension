import { Configuration } from './configuration'
import { AGENT_LAST_UPDATE_DATE } from './constants'
import { PersistenceContext } from './persistence-context'

export const shouldUpdateSpectralAgent = (): boolean => {
  return (
    isOverUpdateThreshold() && Configuration.getInstance().isAutoUpdateEnabled
  )
}

const isOverUpdateThreshold = (): boolean => {
  const lastUpdateDate =
    PersistenceContext.getInstance().getGlobalStateValue<number>(
      AGENT_LAST_UPDATE_DATE
    )
  if (!lastUpdateDate) {
    return true
  }
  const oneWeekInMs = 7 * 24 * 3600 * 1000
  return Date.now() - lastUpdateDate > oneWeekInMs
}
