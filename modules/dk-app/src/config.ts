import { getConfig } from 'modules/config'

export interface DKAppConfig {
  ROOT_URL: string

  /**
   * Where is the webapp?
   */
  WEBAPP_URL: string
}

export default getConfig<DKAppConfig>()
