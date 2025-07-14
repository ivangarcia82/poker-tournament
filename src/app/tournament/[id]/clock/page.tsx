'use client'

import { useState, useEffect } from 'react'
import { Tournament } from '@/types'
import TournamentClock from '@/components/tournament/TournamentClock'

interface TournamentClockPageProps {
  params: Promise<{ id: string }>
}

export default function TournamentClockPage({ params }: TournamentClockPageProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { id } = await params
        
        // Cargar datos del usuario
        const userResponse = await fetch('/api/auth/me')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData)
        }

        // Cargar datos del torneo
        const response = await fetch(`/api/tournaments/${id}`)
        if (response.ok) {
          const data = await response.json()
          console.log('🔄 Datos del torneo actualizados:', {
            id: data.id,
            players: data.players?.length || 0,
            activePlayers: data.players?.filter((p: any) => !p.isEliminated).length || 0,
            prizes: data.prizes?.length || 0,
            status: data.status
          })
          setTournament(data)
        } else {
          console.error('Error loading tournament')
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Configurar intervalo para recargar datos del torneo cada 30 segundos
    const interval = setInterval(async () => {
      try {
        const { id } = await params
        const response = await fetch(`/api/tournaments/${id}`)
        if (response.ok) {
          const data = await response.json()
          console.log('🔄 Datos del torneo actualizados (intervalo):', {
            id: data.id,
            players: data.players?.length || 0,
            activePlayers: data.players?.filter((p: any) => !p.isEliminated).length || 0,
            prizes: data.prizes?.length || 0,
            status: data.status
          })
          setTournament(data)
        }
      } catch (error) {
        console.error('Error reloading tournament data:', error)
      }
    }, 30000) // Recargar cada 30 segundos

    return () => clearInterval(interval)
  }, [params])

  const handleUpdate = () => {
    // Recargar datos del torneo cuando se actualice
    const loadTournament = async () => {
      try {
        const { id } = await params
        const response = await fetch(`/api/tournaments/${id}`)
        if (response.ok) {
          const data = await response.json()
          setTournament(data)
        }
      } catch (error) {
        console.error('Error reloading tournament:', error)
      }
    }
    loadTournament()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-6">
            <svg className="animate-spin h-10 w-10 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando reloj del torneo...</h3>
          <p className="text-gray-600">Preparando la experiencia de juego</p>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl shadow-lg mb-6">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Torneo no encontrado</h3>
          <p className="text-gray-600">El torneo que buscas no existe o no tienes permisos para acceder</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-lg mb-6">
            <svg className="animate-spin h-10 w-10 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Verificando usuario...</h3>
          <p className="text-gray-600">Cargando información de autenticación</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Reloj del Torneo
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {tournament.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {tournament.players?.filter((p: any) => !p.isEliminated).length || 0} Activos
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {tournament.players?.length || 0} Total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
          <div className="relative p-8">
            <TournamentClock 
              tournament={tournament} 
              onUpdate={handleUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 