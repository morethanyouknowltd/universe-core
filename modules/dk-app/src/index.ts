import { App } from '@deepkit/app'
import { eventDispatcher } from '@deepkit/event'
import { FrameworkConfig, FrameworkModule } from '@deepkit/framework'
import { httpWorkflow, JSONResponse } from '@deepkit/http'
import { provide } from '@deepkit/injector'
import { isDev } from 'modules/config'
import config, { DKAppConfig } from './config'

let registeredModules: any[] = []
let registeredProviders: any[] = []

class CORSListener {
  protected headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'Access-Control-Allow-Headers':
      'Origin, X-Requested-With, Content-Type, Accept, authorization',
    'Access-Control-Max-Age': 2592000, // 30 days
  }

  @eventDispatcher.listen(httpWorkflow.onRouteNotFound)
  onRouteNotFound(event: typeof httpWorkflow.onRouteNotFound.event) {
    if (event.request.getUrl().includes('/trpc')) {
      event.response.setHeader('Access-Control-Allow-Origin', '*')
      event.response.setHeader(
        'Access-Control-Allow-Methods',
        'GET,HEAD,PUT,PATCH,POST,DELETE'
      )
      event.response.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, authorization'
      )
      event.response.setHeader('Access-Control-Max-Age', 2592000)
      event.stopPropagation()
      return
    }

    //CORS requirement for example
    if (event.request.method === 'OPTIONS')
      event.send(new JSONResponse(true, 200).headers(this.headers))
  }

  @eventDispatcher.listen(httpWorkflow.onControllerError)
  onControllerError(event: typeof httpWorkflow.onControllerError.event) {
    if (event.sent) return
    if (event.error instanceof Error) {
      event.stopPropagation()
      event.send(
        new JSONResponse(
          {
            message: isDev() ? event.error.message : `Internal server error`,
            stack: isDev() ? event.error.stack : undefined,
          },
          500
        ).disableAutoSerializing()
      )
    }
  }
}

async function checkPortTaken(port: number) {
  const net = await import('net')
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => {
      resolve(true)
    })
    server.once('listening', () => {
      server.close()
      resolve(false)
    })
    server.listen(port)
  })
}

export default async function create({
  providers,
  controllers,
  imports,
  middlewares,
  frameworkConfig,
  listeners,
}: {
  providers: any[]
  listeners: any[]
  controllers?: any[]
  middlewares?: any[]
  imports: any[]
  frameworkConfig?: Partial<FrameworkConfig>
}) {
  const port = frameworkConfig?.port ?? 5002
  // const isPortTaken = await checkPortTaken(port)
  // if (isPortTaken) {
  //   throw new Error(`Port ${port} is already in use`)
  // }

  const allImports = [
    new FrameworkModule({
      debug: isDev(),
      httpLog: true,
      port,
      host: '0.0.0.0',
      ...frameworkConfig,
    }),
    ...imports,
    ...registeredModules,
  ]
  const allProviders = [
    ...providers,
    ...registeredProviders,
    provide<DKAppConfig>({ useValue: config }),
  ]

  const deepkitapp = new App({
    imports: allImports,
    providers: allProviders,
    listeners: [...(listeners ?? []), CORSListener],
    middlewares: middlewares ?? [],
    controllers: controllers ?? [],
  })
  await deepkitapp.run(['server:start'])

  // const RPCKernel = await deepkitapp.get<RpcKernel>(RpcKernel)
  // const rpcAddress = `${config.get().SERVER_RPC_HOST}:${
  //   config.get().SERVER_RPC_PORT ?? 8081
  // }`
  // const logger = deepkitapp.get<Logger>()
  // logger.info(`Starting RPC server at ${rpcAddress}`)
  // const RPCServer = new RpcWebSocketServer(RPCKernel, rpcAddress)
  // RPCServer.start({
  //   host: '0.0.0.0',
  // })

  return deepkitapp
}

export function registerModule(module: any) {
  registeredModules.push(module)
}

export function registerProvider(provider: any) {
  registeredProviders.push(provider)
}
export function registerModules(...modules: any[]) {
  registeredModules.push(...modules)
}

export function registerProviders(...providers: any[]) {
  registeredProviders.push(...providers)
}
