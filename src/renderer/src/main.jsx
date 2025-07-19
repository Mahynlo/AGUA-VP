import './assets/main.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider } from './theme/useTheme'
import { CustomTitleBar } from './TitleBar';
import { FeedbackProvider } from './context/FeedbackContext';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NextUIProvider>
      <ThemeProvider>
        <FeedbackProvider>
        
          <App />
        </FeedbackProvider>
      
      </ThemeProvider>
    </NextUIProvider>
  </React.StrictMode>
)
