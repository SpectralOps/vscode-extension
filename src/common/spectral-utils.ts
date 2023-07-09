import { AGENT_LAST_UPDATE_DATE } from './constants'
import { PersistenceContext } from './persistence-context'

export const getLastAgentUpdateDate = (): number | undefined => {
  return PersistenceContext.getInstance().getGlobalStateValue<number>(
    AGENT_LAST_UPDATE_DATE
  )
}

export const isOneWeekPassedSinceLastUpdate = (): boolean => {
  const lastUpdateDate = getLastAgentUpdateDate()
  if (!lastUpdateDate) {
    return true
  }
  const oneWeekInMs = 7 * 24 * 3600 * 1000
  if (Date.now() - lastUpdateDate > oneWeekInMs) {
    return true
  }
  return false
}
