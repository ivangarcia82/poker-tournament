'use client'

import { Tournament } from '@/types'

interface TournamentListProps {
  tournaments: Tournament[]
  onTournamentSelect: (tournamentId: string) => void
  onRefresh: () => void
  onEditTournament?: (tournament: Tournament) => void
  className?: string
}

export default function TournamentList({ tournaments, onTournamentSelect, onRefresh, onEditTournament, className }: TournamentListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTERING':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      case 'STARTING':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
      case 'RUNNING':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
      case 'FINISHED':
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
      case 'CANCELLED':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'REGISTERING':
        return 'Registrando'
      case 'STARTING':
        return 'Iniciando'
      case 'RUNNING':
        return 'En Curso'
      case 'FINISHED':
        return 'Finalizado'
      case 'CANCELLED':
        return 'Cancelado'
      default:
        return status
    }
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (tournaments.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50"></div>
        <div className="relative p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
            <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            No hay torneos creados
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Crea tu primer torneo para comenzar a gestionar tus eventos de póker
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
      <div className="relative p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Torneos
              </h3>
              <p className="text-sm text-gray-600">
                {tournaments.length} torneo{tournaments.length !== 1 ? 's' : ''} en total
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium">Actualizar</span>
          </button>
        </div>

        <div className="space-y-4">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="group relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/80"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                          {tournament.name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${getStatusColor(tournament.status)}`}>
                            {getStatusText(tournament.status)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ID: {tournament.id.slice(-8)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Buy-in</p>
                          <p className="text-sm font-semibold text-gray-900">${tournament.buyIn}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Jugadores</p>
                          <p className="text-sm font-semibold text-gray-900">{tournament.players?.length || 0}/{tournament.maxPlayers}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Inicio</p>
                          <p className="text-sm font-semibold text-gray-900">{new Date(tournament.startTime).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Organizador</p>
                          <p className="text-sm font-semibold text-gray-900">{tournament.organizer?.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-6">
                    <button
                      onClick={() => onTournamentSelect(tournament.id)}
                      className="ver-detalles-btn flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow hover:bg-gray-50 text-gray-700 font-semibold transition-all duration-200"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Ver Detalles</span>
                    </button>
                    {onEditTournament && tournament.status === 'REGISTERING' && tournament.players?.length === 0 && (
                      <button
                        onClick={() => onEditTournament(tournament)}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-sm font-medium">Editar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 