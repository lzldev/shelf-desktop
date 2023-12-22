import React from 'react'
import ReactDOM from 'react-dom/client'
import {QueryClientProvider, QueryClient} from '@tanstack/react-query'
import {createHashRouter, RouterProvider} from 'react-router-dom'
;(await import('immer')).enableMapSet()

import './assets/index.css'

const Main = React.lazy(() => import('./Main'))
const Start = React.lazy(() => import('./Start'))
const Progress = React.lazy(() => import('./Progress'))

const WindowRouter = createHashRouter([
  {
    path: '/main/*',
    element: <Main />,
  },
  {
    path: '/start/*',
    element: <Start />,
  },
  {
    path: '/progress/*',
    element: <Progress />,
  },
])

const ReactQueryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      networkMode: 'always',
    },
    queries: {
      networkMode: 'always',
    },
  },
})

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={ReactQueryClient}>
        <RouterProvider router={WindowRouter} />
      </QueryClientProvider>
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />,
)
