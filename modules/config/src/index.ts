import { ReceiveType, ReflectionClass, resolveReceiveType } from '@deepkit/type'
import * as dotenv from 'dotenv-flow'
import fs from 'fs-extra'
import { clone } from 'modules/dash'
import { workspacePath } from 'modules/core'
import { readYamlSync } from 'modules/yml'

const silentMode = process.env.ONE_CONFIG_SILENT === 'true'

/**
 * Since sometimes we evaluate stdout to parse json configs, if we
 * log anything else out, we can break the parsing. So we have an env
 * flag to disable logging.
 */
function safeLog(...args: string[]) {
  if (!silentMode) {
    console.log(...args)
  }
}

export interface ConfigType {
  project: string
  env: 'development' | 'production'
  platform: 'node' | 'electron' | 'react-native' | 'web' | 'electron-web'
  platformVersion: string
}

function loadModuleConfig(moduleName: string) {
  const yamlPath = workspacePath('config', `${moduleName}.yml`)
  logOnce(`Checking ${yamlPath}`)
  if (fs.existsSync(yamlPath)) {
    logOnce(`Loading ${yamlPath}`)
    return readYamlSync(yamlPath)
  }
  return {}
}

const envYamlPath = workspacePath('env.yml')
let envYaml: any = {}
if (fs.existsSync(envYamlPath)) {
  envYaml = readYamlSync(envYamlPath)
  safeLog(`Loaded yml env from ${envYamlPath}`)
}

safeLog(`Loading environment variables from ${process.cwd()}`)
dotenv.config({
  silent: silentMode,
})

const currNodeVersion = process.versions.node
export const isElectron = !!process.versions.electron

const config: ConfigType = {
  // Somehow we want to dynamically change this for each projec that uses one
  project: 'Lockpick',
  env: 'development',
  platform: isElectron ? 'electron' : 'node', // TODO actually implement
  platformVersion: currNodeVersion,
}

export default config
// const configsById: { [id: string]: any } = {}

let alreadyLogged: { [key: string]: boolean } = {}
const logOnce = (msg: string, ...rest: any[]) => {
  if (!alreadyLogged[msg]) {
    alreadyLogged[msg] = true
    safeLog(msg, ...rest)
  }
}

const profileVarName = 'ENV_PROFILE'

function getEffectiveVar(varName: string, profile?: string, module?: string) {
  if (!profile && varName !== profileVarName) {
    // Check if we have a profile
    profile = getEffectiveVar(profileVarName)
    logOnce(`Using profile ${profile}`)
  }

  const moduleVars = module ? loadModuleConfig(module) : {}

  let profileVars = {
    ...envYaml?.profiles?.[profile],
  }

  if (typeof profileVars !== 'object') {
    profileVars = {}
  }

  // console.log({ profileVars })

  const retu =
    // Env vars always win
    process.env[varName] ??
    // Then Module profile vars
    moduleVars?.profiles?.[profile]?.[varName] ??
    // Then module vars
    moduleVars?.[varName] ??
    // Then profile vars (global)
    profileVars[varName] ??
    // Then global vars
    envYaml?.[varName]
  return retu
}

/**
 * @todo Doesn't actually validate type, seems to create a stackoverflow bug
 *   with deepkit/type
 */
export function createConfig<T>(module?: string, type?: ReceiveType<T>) {
  type = resolveReceiveType(type)

  // const id = type.typeName ?? (type as any).classType?.name

  return {
    get: (): T => {
      const out = {}
      // if (id && configsById[id]) {
      //   Object.assign(out, validatedDeserialize<T>(configsById[id]))
      // }

      // TODO be careful here since we're potentially exposes env vars to who knows what
      const reflected = ReflectionClass.from(type)
      const keys = reflected.getProperties().map((p) => p.name)

      for (const key of keys) {
        out[key] = getEffectiveVar(key, undefined, module)
        if (
          out[key] === undefined &&
          !reflected.getProperty(key).isOptional()
        ) {
          throw new Error(`Missing config value for ${key}`)
        }
      }

      return out as any
    },
  }
}

/**
 * @deprecated internal
 */
export function _getEntireConfig() {
  const out: { [key: string]: string | number | boolean } = {}

  for (const profile in envYaml.profiles ?? {}) {
    for (const key in envYaml.profiles[profile]) {
      out[key] = getEffectiveVar(key)
    }
  }

  for (const key in envYaml) {
    if (key !== 'profiles') {
      // Overwrite any vars with those from the active profile
      out[key] = getEffectiveVar(key)
    }
  }

  return out
}

/**
 * @deprecated
 */
export function assignConfig<C extends Partial<ConfigType>, T = any>(
  c: C,
  classs?: ReflectionClass<T>
) {
  // const id = classs?.getClassName()
  // if (id) {
  //   configsById[id] = c
  // } else {
  //   Object.assign(config, c)
  // }
}

export function getConfig<T>(module?: string, type?: ReceiveType<T>) {
  // If module not provided, try find from stack trace
  if (!module) {
    const stack = new Error().stack
    if (stack) {
      const oneModuleRegex = /(@one|built-modules)\/([a-zA-Z-_]+)/gi
      const matches = stack.match(oneModuleRegex)
      if (matches) {
        const firstMatchNotConfig = matches.find((m) => !m.includes('/config'))
        if (firstMatchNotConfig) {
          module = firstMatchNotConfig.split('/')[1]
        }
      }
    }
  }

  return createConfig<T>(module, type).get()
}

function getEnv() {
  return getEffectiveVar('NODE_ENV')
}

export function isDev() {
  return !isProd()
}

export function isProd() {
  return getEnv() === 'production'
}
