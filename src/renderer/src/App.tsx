import React from 'react'
import ReactDOM from 'react-dom/client'
import {QueryClientProvider, QueryClient} from '@tanstack/react-query'
import {createHashRouter, RouterProvider} from 'react-router-dom'
;(await import('immer')).enableMapSet()

import './assets/index.css'

import {Main} from './Main'
import {Start} from './Start'
import {Progress} from './Progress'
import {useConfigStore} from './hooks/useConfig'
import {useTags} from './hooks/useTags'
import {useColors} from './hooks/useColors'
import {useLocalConfigStore} from './hooks/useLocalConfig'

const WindowRouter = createHashRouter([
  {
    path: '/',
    element: <Main />,
  },
  {
    path: '/start',
    element: <Start />,
  },
  {
    path: '/progress',
    element: <Progress />,
  },
])

const ReactQueryClient = new QueryClient()

const App = () => {
  const {isReady: isReadyConfig} = useConfigStore()
  const {isReady: isReadyLocalConfig} = useLocalConfigStore()
  const {isReady: isReadyTags} = useTags()
  const {isReady: isReadyColors} = useColors()

  const isReady =
    isReadyTags && isReadyConfig && isReadyColors && isReadyLocalConfig

  if (!isReady) {
    return <></>
  }
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
