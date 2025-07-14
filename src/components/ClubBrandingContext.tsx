import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

const DEFAULT_LOGO = '/public/logo-default.svg'
const DEFAULT_COLORS = {
  primary: '#2563eb',
  secondary: '#f3f4f6',
  accent: '#22c55e'
}

export interface ClubBranding {
  logoUrl: string
  colorPrimary: string
  colorSecondary: string
  colorAccent: string
}

const ClubBrandingContext = createContext<ClubBranding>({
  logoUrl: DEFAULT_LOGO,
  colorPrimary: DEFAULT_COLORS.primary,
  colorSecondary: DEFAULT_COLORS.secondary,
  colorAccent: DEFAULT_COLORS.accent
})

export function useClubBranding() {
  return useContext(ClubBrandingContext)
}

export function ClubBrandingProvider({ clubId, children }: { clubId: string, children: ReactNode }) {
  const [branding, setBranding] = useState<ClubBranding>({
    logoUrl: DEFAULT_LOGO,
    colorPrimary: DEFAULT_COLORS.primary,
    colorSecondary: DEFAULT_COLORS.secondary,
    colorAccent: DEFAULT_COLORS.accent
  })

  useEffect(() => {
    async function fetchBranding() {
      try {
        const res = await fetch(`/api/clubs/${clubId}`)
        if (res.ok) {
          const data = await res.json()
          setBranding({
            logoUrl: data.logoUrl || DEFAULT_LOGO,
            colorPrimary: data.colorPrimary || DEFAULT_COLORS.primary,
            colorSecondary: data.colorSecondary || DEFAULT_COLORS.secondary,
            colorAccent: data.colorAccent || DEFAULT_COLORS.accent
          })
        }
      } catch {
        // Si falla, usar defaults
      }
    }
    if (clubId) fetchBranding()
  }, [clubId])

  // Propagar colores como CSS variables
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--club-primary', branding.colorPrimary)
    root.style.setProperty('--club-secondary', branding.colorSecondary)
    root.style.setProperty('--club-accent', branding.colorAccent)
  }, [branding])

  return (
    <ClubBrandingContext.Provider value={branding}>
      {children}
    </ClubBrandingContext.Provider>
  )
} 