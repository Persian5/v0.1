import { createContext } from 'react'
import { UserLessonProgress } from '@/lib/supabase/database'

interface XpContextType {
  xp: number
  isXpLoading: boolean
  setXp: React.Dispatch<React.SetStateAction<number>>
}

interface ProgressContextType {
  progressData: UserLessonProgress[]
  isProgressLoading: boolean
  setProgressData: React.Dispatch<React.SetStateAction<UserLessonProgress[]>>
}

export const XpContext = createContext<XpContextType | undefined>(undefined)
export const ProgressContext = createContext<ProgressContextType | undefined>(undefined) 