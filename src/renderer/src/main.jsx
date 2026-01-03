import './assets/main.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider } from './theme/useTheme'
import { CustomTitleBar } from './TitleBar';
import { FeedbackProvider } from './context/FeedbackContext';
import { DashboardProvider } from './context/DashboardContext';
import { ReportesProvider } from './context/ReportesContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NextUIProvider>
      <ThemeProvider>
        <FeedbackProvider>
          <DashboardProvider>
            <ReportesProvider>
              <App />
            </ReportesProvider>
          </DashboardProvider>
        </FeedbackProvider>

      </ThemeProvider>
    </NextUIProvider>
  </React.StrictMode>
)
