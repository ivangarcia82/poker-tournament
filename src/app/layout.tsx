"use client"

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import ClubOnboarding from '@/components/onboarding/ClubOnboarding'
import { useEffect, useState } from 'react'
import { TutorialProvider } from '@/components/onboarding/TutorialContext'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          window.location.href = '/login'
          return
        }
        
        const user = await response.json()
        if (!user.clubId) {
          setUserId(user.id)
          setShowOnboarding(true)
        }
        setIsLoading(false)
      } catch (error) {
        window.location.href = '/login'
      }
    }
    
    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <html lang="es">
        <body className={inter.className}>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando...</p>
            </div>
          </div>
        </body>
      </html>
    )
  }

  if (showOnboarding) {
    return (
      <html lang="es">
        <body className={inter.className}>
          <ClubOnboarding 
            userId={userId} 
            onComplete={() => window.location.reload()} 
          />
        </body>
      </html>
    )
  }

  return (
    <html lang="es">
      <body className={inter.className}>
        <TutorialProvider>
          {children}
        </TutorialProvider>
      </body>
    </html>
  )
}
