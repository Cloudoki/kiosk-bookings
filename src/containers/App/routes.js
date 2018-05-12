import React from 'react'
import { Route, Switch } from 'react-router'
import Dashboard from 'containers/Dashboard'
import NotFound from 'components/NotFound'

/**
 * Add routes here
 * - should the route be protected by auth? - `scopes: [string]`
 *    Array of the required scopes for the route.
 *
 * - should the route have bottom navigation? - `navigation: true`
 */
export const routesConfig = [
  { path: '/', exact: true, component: Dashboard },
  { component: NotFound }
]

export default () => [
  <Switch key='routes'>
    {routesConfig.map((route, indx) =>
      <Route
        key={`routes-${indx}`}
        path={route.path}
        exact={route.exact}
        component={route.component}
      />
    )}
  </Switch>
]
