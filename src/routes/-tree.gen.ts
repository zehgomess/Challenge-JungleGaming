import { createRouter } from '@tanstack/react-router'
import { rootRoute } from './__root'
import { Route as IndexRoute } from './index'

export const routeTree = rootRoute.addChildren([IndexRoute])

export const router = createRouter({ routeTree })