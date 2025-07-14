'use client'

import { useState, useEffect } from 'react'
import { User, Tournament } from '@/types'
import TournamentList from './TournamentList'
import CreateTournamentModal from './CreateTournamentModal'
import TournamentDetail from './TournamentDetail'
import ClubPlayers from './ClubPlayers'
import ClubBrandingSettings from './ClubBrandingSettings'
import ClubInfo from './ClubInfo'
import CreateClubModal from '../onboarding/CreateClubModal'
import TutorialOverlay from '../onboarding/TutorialOverlay'
import { useTutorial } from '../onboarding/TutorialContext'

interface DashboardProps {
  user: User
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  console.log('Dashboard montado', user)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'tournaments' | 'players' | 'club'>('tournaments')
  const [showCreateClubModal, setShowCreateClubModal] = useState(false)
  const [userClub, setUserClub] = useState<any>(null)
  const [checkingClub, setCheckingClub] = useState(true)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const { step, next: tutorialNext, isActive, setActive } = useTutorial()


  useEffect(() => {
    checkUserClub()
    fetchTournaments()
    checkTutorialStatus()
  }, [])

  const checkUserClub = async () => {
    try {
      const response = await fetch('/api/clubs')
      if (response.ok) {
        const club = await response.json()
        setUserClub(club)
      } else if (response.status === 404) {
        // Usuario no tiene club, mostrar modal
        if (user.role === 'ORGANIZER' || user.role === 'STAFF') {
          setShowCreateClubModal(true)
        }
      }
    } catch (error) {
      console.error('Error checking user club:', error)
    } finally {
      setCheckingClub(false)
    }
  }

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments')
      if (response.ok) {
        const data = await response.json()
        setTournaments(data)
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTournament = async (tournamentData: any) => {
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tournamentData)
      })

      if (response.ok) {
        await fetchTournaments()
        setShowCreateModal(false)
        if (isActive && step === 2) tutorialNext()
      }
    } catch (error) {
      console.error('Error creating tournament:', error)
    }
  }

  const handleEditTournament = async (tournamentData: any) => {
    if (!editingTournament) return

    try {
      const response = await fetch(`/api/tournaments/${editingTournament.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tournamentData)
      })

      if (response.ok) {
        await fetchTournaments()
        setEditingTournament(null)
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Error updating tournament:', error)
    }
  }

  const handleTournamentSelect = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`)
      if (response.ok) {
        const tournament = await response.json()
        setSelectedTournament(tournament)
        if (isActive && step === 3) tutorialNext()
      }
    } catch (error) {
      console.error('Error fetching tournament:', error)
    }
  }

  const handleBackToList = () => {
    setSelectedTournament(null)
  }

  const handleEditTournamentClick = (tournament: Tournament) => {
    setEditingTournament(tournament)
    setShowCreateModal(true)
  }

  const handleTournamentUpdate = async () => {
    console.log('🔄 Actualizando torneo...')
    console.log('Estado actual del torneo:', selectedTournament?.status)
    
    // Actualizar la lista de torneos
    await fetchTournaments()
    
    // Si hay un torneo seleccionado, actualizarlo también
    if (selectedTournament) {
      try {
        const response = await fetch(`/api/tournaments/${selectedTournament.id}`)
        if (response.ok) {
          const updatedTournament = await response.json()
          console.log('✅ Torneo actualizado:', updatedTournament.status)
          setSelectedTournament(updatedTournament)
        }
      } catch (error) {
        console.error('Error updating selected tournament:', error)
      }
    }
  }

  const handleClubCreated = () => {
    setShowCreateClubModal(false)
    checkUserClub()
  }

  const checkTutorialStatus = async () => {
    try {
      const res = await fetch(`/api/users/${user.id}`)
      const text = await res.text()
      console.log('Respuesta cruda:', text)
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        console.error('No se pudo parsear JSON:', e)
        data = {}
      }
      console.log('Tutorial status:', data)
      if (!data.hasCompletedTutorial) {
        setActive(true)
      }
    } catch (e) {
      console.error('Error al consultar tutorial:', e)
    }
  }

  const handleTutorialComplete = async () => {
    setActive(false)
    await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hasCompletedTutorial: true })
    })
  }

  const handleTutorialSkip = handleTutorialComplete

  // Trigger: avanzar al hacer click en 'Torneos' en el menú
  const handleNavClick = (section: 'tournaments' | 'players' | 'club') => {
    setActiveSection(section)
    if (isActive && step === 1 && section === 'tournaments') tutorialNext()
  }
  // Trigger: avanzar al crear torneo
  const handleAddPlayer = (...args: any[]) => {
    if (isActive && step === 4) tutorialNext()
    // No implemento aquí la lógica real, solo el trigger para el tutorial
  }

  if (loading || checkingClub) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-6">
            <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Cargando...</h3>
          <p className="text-gray-600 mt-2">Preparando tu dashboard</p>
        </div>
      </div>
    )
  }

  // Menú principal
  return (
    <>
      <TutorialOverlay isVisible={showTutorial} onComplete={handleTutorialComplete} onSkip={handleTutorialSkip} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
        </div>

        {/* Header */}
        <header className="relative bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <span className="text-xl">🃏</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Poker Tournament Manager
                  </h1>
                  {userClub && (
                    <p className="text-sm text-gray-600 mt-1">
                      Club: {userClub.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role.toLowerCase()}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
            
            {/* Menú de navegación */}
            <nav className="flex space-x-1 pb-4" id="nav">
              <button
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeSection === 'tournaments' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
                onClick={() => handleNavClick('tournaments')}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Torneos</span>
              </button>
              <button
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeSection === 'players' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
                onClick={() => setActiveSection('players')}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>Jugadores</span>
              </button>
              <button
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeSection === 'club' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
                onClick={() => setActiveSection('club')}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Club</span>
              </button>
            </nav>
          </div>
        </header>

        {/* Contenido según sección */}
        <main className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {activeSection === 'tournaments' && (
              selectedTournament ? (
                <TournamentDetail
                  tournament={selectedTournament}
                  user={user}
                  onBack={handleBackToList}
                  onUpdate={handleTournamentUpdate}
                />
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Mis Torneos
                      </h2>
                      <p className="text-gray-600 mt-2">
                        Gestiona todos tus torneos de poker en un solo lugar
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg font-semibold transition-all duration-200 transform hover:scale-105 create-tournament-btn"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Crear Torneo</span>
                    </button>
                  </div>
                  <TournamentList
                    tournaments={tournaments}
                    onTournamentSelect={handleTournamentSelect}
                    onRefresh={fetchTournaments}
                    onEditTournament={handleEditTournamentClick}
                    className="tournament-list"
                  />
                </>
              )
            )}
            {activeSection === 'players' && (
              <div className="players-section">
                <ClubPlayers user={user} onAddPlayer={handleAddPlayer} />
              </div>
            )}
            {activeSection === 'club' && (
              <div className="club-section">
                <ClubInfo user={user} />
              </div>
            )}
          </div>
        </main>

        {/* Create Tournament Modal */}
        {showCreateModal && (
          <CreateTournamentModal
            onClose={() => {
              setShowCreateModal(false)
              setEditingTournament(null)
            }}
            onSubmit={editingTournament ? handleEditTournament : handleCreateTournament}
            tournament={editingTournament}
          />
        )}

        {/* Create Club Modal */}
        {showCreateClubModal && (
          <CreateClubModal
            isOpen={showCreateClubModal}
            onClose={() => setShowCreateClubModal(false)}
            onSuccess={handleClubCreated}
          />
        )}
      </div>
    </>
  )
} 