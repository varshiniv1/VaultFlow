'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { getFraudAlerts } from './api'

interface AppContextType {
  openAlertCount: number
  refreshAlertCount: () => void
}

const AppContext = createContext<AppContextType>({
  openAlertCount: 0,
  refreshAlertCount: () => {},
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [openAlertCount, setOpenAlertCount] = useState(0)

  const refreshAlertCount = useCallback(() => {
    getFraudAlerts()
      .then((alerts) => setOpenAlertCount(alerts.filter((a) => a.status === 'OPEN').length))
      .catch(() => {})
  }, [])

  useEffect(() => {
    refreshAlertCount()
  }, [refreshAlertCount])

  return (
    <AppContext.Provider value={{ openAlertCount, refreshAlertCount }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
