import {
  createContext,
  useContext
} from 'react'

import { useRelatorios } from '../hooks/useRelatorios'

const RelatoriosContext =
  createContext<any>(null)

export function RelatoriosProvider({
  children
}: {
  children: React.ReactNode
}) {

  const relatorios =
    useRelatorios()

  return (
    <RelatoriosContext.Provider
      value={relatorios}
    >
      {children}
    </RelatoriosContext.Provider>
  )
}

export function useRelatoriosContext() {

  const context =
    useContext(RelatoriosContext)

  if (!context) {
    throw new Error(
      'useRelatoriosContext deve ser usado dentro do RelatoriosProvider'
    )
  }

  return context
}