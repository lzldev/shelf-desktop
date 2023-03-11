import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/index.css'
import App from './App'
import StartPage from './StartPage'
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
])

const ReactQueryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={ReactQueryClient}>
      <RouterProvider router={WindowRouter} />
    </QueryClientProvider>
  </React.StrictMode>,
)
