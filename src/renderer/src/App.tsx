import React from 'react'
import ReactDOM from 'react-dom/client'
import {QueryClientProvider, QueryClient} from '@tanstack/react-query'
import {createHashRouter, RouterProvider} from 'react-router-dom'

import './assets/index.css'

import Main from './Main'
import Start from './Start'
import Progress from './Progress'
import Options from './Options'

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
  {
    path: '/options',
    element: <Options />,
  },
])

const ReactQueryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={ReactQueryClient}>
      <RouterProvider router={WindowRouter} />
    </QueryClientProvider>
  </React.StrictMode>,
)
