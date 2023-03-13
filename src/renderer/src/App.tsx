import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/index.css'
import App from './Main'
import StartPage from './StartPage'
import Content from './Content'
import ProgressDialog from './ProgressDialog'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { createHashRouter, RouterProvider } from 'react-router-dom'

const WindowRouter = createHashRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/start',
    element: <StartPage />,
  },
  {
    path: '/progress',
    element: <ProgressDialog />,
  },
  {
    path: '/content',
    element: <Content />,
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
