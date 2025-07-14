import React, { createContext, useContext, useState, ReactNode } from 'react'

interface TutorialContextType {
  step: number
  setStep: (step: number) => void
  next: () => void
  prev: () => void
  skip: () => void
  finish: () => void
  isActive: boolean
  setActive: (active: boolean) => void
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(0)
  const [isActive, setActive] = useState(false)

  const next = () => setStep((s) => s + 1)
  const prev = () => setStep((s) => (s > 0 ? s - 1 : 0))
  const skip = () => { setActive(false); setStep(0) }
  const finish = () => { setActive(false); setStep(0) }

  return (
    <TutorialContext.Provider value={{ step, setStep, next, prev, skip, finish, isActive, setActive }}>
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  const ctx = useContext(TutorialContext)
  if (!ctx) throw new Error('useTutorial debe usarse dentro de TutorialProvider')
  return ctx
} 