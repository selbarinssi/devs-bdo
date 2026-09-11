/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as ShipsRouteImport } from './routes/ships'
import { Route as VoyageRouteImport } from './routes/voyage'
import { Route as RoutinesRouteImport } from './routes/routines'
import { Route as GrindRouteImport } from './routes/grind'

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const ShipsRoute = ShipsRouteImport.update({
  id: '/ships',
  path: '/ships',
  getParentRoute: () => rootRouteImport,
} as any)
const VoyageRoute = VoyageRouteImport.update({
  id: '/voyage',
  path: '/voyage',
  getParentRoute: () => rootRouteImport,
} as any)
const RoutinesRoute = RoutinesRouteImport.update({
  id: '/routines',
  path: '/routines',
  getParentRoute: () => rootRouteImport,
} as any)
const GrindRoute = GrindRouteImport.update({
  id: '/grind',
  path: '/grind',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/ships': typeof ShipsRoute
  '/voyage': typeof VoyageRoute
  '/routines': typeof RoutinesRoute
  '/grind': typeof GrindRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/ships': typeof ShipsRoute
  '/voyage': typeof VoyageRoute
  '/routines': typeof RoutinesRoute
  '/grind': typeof GrindRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/ships': typeof ShipsRoute
  '/voyage': typeof VoyageRoute
  '/routines': typeof RoutinesRoute
  '/grind': typeof GrindRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/ships' | '/voyage' | '/routines' | '/grind'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/ships' | '/voyage' | '/routines' | '/grind'
  id: '__root__' | '/' | '/ships' | '/voyage' | '/routines' | '/grind'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  ShipsRoute: typeof ShipsRoute
  VoyageRoute: typeof VoyageRoute
  RoutinesRoute: typeof RoutinesRoute
  GrindRoute: typeof GrindRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/ships': {
      id: '/ships'
      path: '/ships'
      fullPath: '/ships'
      preLoaderRoute: typeof ShipsRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/voyage': {
      id: '/voyage'
      path: '/voyage'
      fullPath: '/voyage'
      preLoaderRoute: typeof VoyageRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/routines': {
      id: '/routines'
      path: '/routines'
      fullPath: '/routines'
      preLoaderRoute: typeof RoutinesRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/grind': {
      id: '/grind'
      path: '/grind'
      fullPath: '/grind'
      preLoaderRoute: typeof GrindRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  ShipsRoute: ShipsRoute,
  VoyageRoute: VoyageRoute,
  RoutinesRoute: RoutinesRoute,
  GrindRoute: GrindRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { createStart } from '@tanstack/react-start'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
  }
}
