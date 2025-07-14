'use client'

import { useState, useEffect } from 'react'
import { Tournament, Player } from '@/types'
import { calculatePrizePool } from '@/lib/tournament-utils'

interface PrizeAssignmentModalProps {
  tournament: Tournament
  onClose: () => void
  onAssign: (assignments: { playerId: string; position: number; amount: number }[]) => void
  isAssigning: boolean
}

export default function PrizeAssignmentModal({ 
  tournament, 
  onClose, 
  onAssign, 
  isAssigning 
}: PrizeAssignmentModalProps) {
  const [assignments, setAssignments] = useState<{ playerId: string; position: number; amount: number }[]>([])
  const [availablePositions, setAvailablePositions] = useState<number[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)

  const prizePool = calculatePrizePool(
    tournament.buyIn,
    tournament.addOn || 0,
    tournament.players.length,
    tournament.rake
  )

  // Obtener jugadores activos (no eliminados)
  const activePlayers = tournament.players.filter(p => !p.isEliminated)
  
  // Obtener posiciones con premios
  const prizePositions = tournament.prizes.map(p => p.position).sort((a, b) => a - b)

  useEffect(() => {
    // Inicializar posiciones disponibles
    setAvailablePositions(prizePositions)
  }, [tournament.prizes])

  const handleAddAssignment = () => {
    if (!selectedPlayer || selectedPosition === null) return

    const player = tournament.players.find(p => p.id === selectedPlayer)
    const prize = tournament.prizes.find(p => p.position === selectedPosition)
    
    if (!player || !prize) return

    const amount = (prizePool * prize.percentage) / 100

    const newAssignment = {
      playerId: selectedPlayer,
      position: selectedPosition,
      amount: amount
    }

    setAssignments([...assignments, newAssignment])
    setAvailablePositions(availablePositions.filter(pos => pos !== selectedPosition))
    setSelectedPlayer('')
    setSelectedPosition(null)
  }

  const handleRemoveAssignment = (playerId: string) => {
    const assignment = assignments.find(a => a.playerId === playerId)
    if (assignment) {
      setAssignments(assignments.filter(a => a.playerId !== playerId))
      setAvailablePositions([...availablePositions, assignment.position].sort((a, b) => a - b))
    }
  }

  const handleSubmit = () => {
    if (assignments.length === 0) return
    onAssign(assignments)
  }

  const getPlayerName = (playerId: string) => {
    return tournament.players.find(p => p.id === playerId)?.name || 'Jugador desconocido'
  }

  const getPositionPrize = (position: number) => {
    const prize = tournament.prizes.find(p => p.position === position)
    return prize ? (prizePool * prize.percentage) / 100 : 0
  }

  const assignedPlayerIds = assignments.map(a => a.playerId)
  const unassignedPlayers = activePlayers.filter(p => !assignedPlayerIds.includes(p.id))

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border border-white/20">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/30 to-orange-50/30"></div>
        <div className="relative p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">🏆 Asignación de Premios</h2>
                <p className="text-gray-600 mt-1">Distribuye los premios entre los jugadores</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isAssigning}
              className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Información del torneo */}
            <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Información del Torneo</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/80 rounded-lg p-3 border border-white/30">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Torneo</p>
                    <p className="text-sm font-semibold text-gray-900">{tournament.name}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 border border-white/30">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Jugadores</p>
                    <p className="text-sm font-semibold text-gray-900">{tournament.players.length}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 border border-white/30">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pozo de Premios</p>
                    <p className="text-sm font-semibold text-gray-900">${prizePool.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 border border-white/30">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Posiciones Premiadas</p>
                    <p className="text-sm font-semibold text-gray-900">{prizePositions.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario para agregar asignación */}
            <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 to-emerald-50/50"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Asignar Premio</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jugador</label>
                    <select
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    >
                      <option value="">Seleccionar jugador...</option>
                      {unassignedPlayers.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.chips} fichas)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Posición</label>
                    <select
                      value={selectedPosition || ''}
                      onChange={(e) => setSelectedPosition(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    >
                      <option value="">Seleccionar posición...</option>
                      {availablePositions.map(position => (
                        <option key={position} value={position}>
                          {position}° lugar - ${getPositionPrize(position).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleAddAssignment}
                      disabled={!selectedPlayer || selectedPosition === null}
                      className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="font-medium">Asignar Premio</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de asignaciones */}
            <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-50/50 to-orange-50/50"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Premios Asignados</h3>
                </div>
                
                {assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.334A7.97 7.97 0 0012 5c-2.34 0-4.29 1.009-5.824 2.562" />
                    </svg>
                    <p className="text-gray-500">No hay premios asignados aún</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Posición
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Jugador
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Premio
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {assignments.sort((a, b) => a.position - b.position).map((assignment) => (
                          <tr key={assignment.playerId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm">
                                {assignment.position}°
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                              {getPlayerName(assignment.playerId)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">
                              ${assignment.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleRemoveAssignment(assignment.playerId)}
                                className="inline-flex items-center space-x-1 text-red-600 hover:text-red-800 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="text-sm">Eliminar</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen */}
            <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Resumen</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/80 rounded-lg p-3 border border-white/30">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Premios Asignados</p>
                    <p className="text-sm font-semibold text-gray-900">{assignments.length}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 border border-white/30">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Posiciones Restantes</p>
                    <p className="text-sm font-semibold text-gray-900">{availablePositions.length}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 border border-white/30">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Premiado</p>
                    <p className="text-sm font-semibold text-green-600">${assignments.reduce((sum, a) => sum + a.amount, 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 border border-white/30">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Restante del Pozo</p>
                    <p className="text-sm font-semibold text-gray-900">${(prizePool - assignments.reduce((sum, a) => sum + a.amount, 0)).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                disabled={isAssigning}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-medium">Cancelar</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={assignments.length === 0 || isAssigning}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAssigning ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="font-medium">Asignando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium">🏆 Asignar Premios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 