import React from 'react'
import ReactDOM from 'react-dom/client'
import DogRegistryApp from './DogRegistryApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <DogRegistryApp />
  </React.StrictMode>,
)
