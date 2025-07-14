'use client'

import { useState, useEffect } from 'react'
import { Tournament, User } from '@/types'

interface AuditLog {
  id: string
  action: string
  details: string
  createdAt: string
  user: {
    name: string
    email: string
  }
  playerId?: string
  player?: {
    name: string
  }
}

interface TournamentHistoryProps {
  tournament: Tournament
  user: User
}

export default function TournamentHistory({ tournament, user }: TournamentHistoryProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [tournament.id])

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/history`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error('Error obteniendo historial:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE_TOURNAMENT':
        return '🎯'
      case 'START_TOURNAMENT':
        return '🚀'
      case 'PAUSE_TOURNAMENT':
        return '⏸️'
      case 'RESUME_TOURNAMENT':
        return '▶️'
      case 'FINISH_TOURNAMENT':
        return '🏁'
      case 'ADD_PLAYER':
        return '👤'
      case 'DELETE_PLAYER':
        return '🗑️'
      case 'EDIT_PLAYER':
        return '✏️'
      case 'ADD_REBUY':
        return '💰'
      case 'REMOVE_REBUY':
        return '💸'
      case 'ADD_ADDON':
        return '🎁'
      case 'REMOVE_ADDON':
        return '📦'
      case 'ASSIGN_BONUS':
        return '🎉'
      case 'REMOVE_BONUS':
        return '🎊'
      case 'REGISTER_PAYMENT':
        return '💳'
      case 'CHANGE_LEVEL':
        return '📈'
      default:
        return '📝'
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('REMOVE')) {
      return 'text-red-600 bg-red-50'
    }
    if (action.includes('ADD') || action.includes('CREATE') || action.includes('START')) {
      return 'text-green-600 bg-green-50'
    }
    if (action.includes('PAUSE')) {
      return 'text-yellow-600 bg-yellow-50'
    }
    if (action.includes('RESUME')) {
      return 'text-blue-600 bg-blue-50'
    }
    return 'text-gray-600 bg-gray-50'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.action.includes(filter.toUpperCase())
    const matchesSearch = searchTerm === '' || 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Historial de Acciones
            </h3>
            <p className="text-sm text-gray-500">
              {logs.length} acciones registradas
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                filter === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('player')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                filter === 'player' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Jugadores
            </button>
            <button
              onClick={() => setFilter('tournament')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                filter === 'tournament' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Torneo
            </button>
            <button
              onClick={() => setFilter('payment')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                filter === 'payment' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pagos
            </button>
            <button
              onClick={() => setFilter('transaction')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                filter === 'transaction' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Transacciones
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Buscar en el historial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Lista de acciones */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2">No se encontraron acciones</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getActionIcon(log.action)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        {log.player && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {log.player.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 mb-1">{log.details}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>👤 {log.user.name}</span>
                        <span>🕒 {formatDate(log.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredLogs.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Mostrando {filteredLogs.length} de {logs.length} acciones
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 