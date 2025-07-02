import { createContext } from 'react'

interface XpContextType {
  xp: number
  isXpLoading: boolean
  setXp: React.Dispatch<React.SetStateAction<number>>
}

export const XpContext = createContext<XpContextType | undefined>(undefined) 