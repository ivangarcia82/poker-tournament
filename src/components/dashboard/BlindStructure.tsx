'use client'

import { Tournament, BlindStructure as BlindStructureType } from '@/types'
import { calculateTimeRemaining, formatTime } from '@/lib/tournament-utils'
import { useState } from 'react'

interface BlindStructureProps {
  blindStructure: BlindStructureType[]
  tournament: Tournament
  user: import('@/types').User
}

export default function BlindStructure({ blindStructure, tournament, user }: BlindStructureProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newBlind, setNewBlind] = useState({
    level: blindStructure.length + 1,
    smallBlind: 0,
    bigBlind: 0,
    duration: 15
  })

  const handleAddBlind = async () => {
    if (!newBlind.smallBlind || !newBlind.bigBlind || !newBlind.duration) {
      alert('Por favor completa todos los campos')
      return
    }

    setIsLoading(true)
    try {
      const updatedBlindStructure = [...blindStructure, newBlind]
      
      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blindStructure: updatedBlindStructure
        }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar la estructura de blinds')
      }

      // Recargar la página para mostrar los cambios
      window.location.reload()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al agregar el nivel de blind')
    } finally {
      setIsLoading(false)
      setShowAddModal(false)
    }
  }

  // Calcular el nivel actual y tiempo restante
  const getCurrentLevel = () => {
    if (tournament.status !== 'RUNNING') return null
    
    const now = new Date()
    const startTime = new Date(tournament.startTime)
    const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60))
    
    let totalDuration = 0
    for (let i = 0; i < blindStructure.length; i++) {
      totalDuration += blindStructure[i].duration
      if (elapsedMinutes < totalDuration) {
        return {
          level: i + 1,
          timeRemaining: totalDuration - elapsedMinutes
        }
      }
    }
    
    return {
      level: blindStructure.length,
      timeRemaining: 0
    }
  }

  const currentLevel = getCurrentLevel()
  const currentBlind = blindStructure[(currentLevel?.level || 1) - 1] || blindStructure[blindStructure.length - 1]

  return (
    <div className="space-y-6">
      {/* Blind actual */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Blind Actual
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {currentBlind?.smallBlind || 0}
              </div>
              <div className="text-sm text-gray-500">Small Blind</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {currentBlind?.bigBlind || 0}
              </div>
              <div className="text-sm text-gray-500">Big Blind</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currentLevel?.timeRemaining ? formatTime(currentLevel.timeRemaining) : '--:--'}
              </div>
              <div className="text-sm text-gray-500">Tiempo Restante</div>
            </div>
          </div>
        </div>
      </div>

      {/* Estructura completa */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Estructura Completa de Blinds
          </h3>
          {/* Botón solo para el organizador */}
          {user.id === tournament.organizerId && (
            <button
              className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              onClick={() => setShowAddModal(true)}
            >
              + Agregar Nivel
            </button>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Small Blind
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Big Blind
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duración (min)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blindStructure.map((blind, index) => (
                  <tr key={index} className={index === ((currentLevel?.level || 1) - 1) ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {blind.level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {blind.smallBlind}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {blind.bigBlind}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {blind.duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal para agregar blind */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md mx-auto">
            {/* Overlay con gradiente */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl"></div>
            
            {/* Contenido del modal */}
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Agregar Nuevo Nivel</h3>
                      <p className="text-blue-100 text-sm">Configura un nuevo nivel de blind</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="inline-flex items-center justify-center w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all duration-200"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenido principal */}
              <div className="p-6 space-y-6">
                <form className="space-y-6">
                  {/* Nivel */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Nivel
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      </div>
                      <input
                        type="number"
                        value={newBlind.level}
                        onChange={(e) => setNewBlind({...newBlind, level: parseInt(e.target.value)})}
                        className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        min={1}
                      />
                    </div>
                  </div>

                  {/* Small Blind y Big Blind */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Small Blind
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <input
                          type="number"
                          value={newBlind.smallBlind}
                          onChange={(e) => setNewBlind({...newBlind, smallBlind: parseInt(e.target.value)})}
                          className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          min={0}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Big Blind
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <input
                          type="number"
                          value={newBlind.bigBlind}
                          onChange={(e) => setNewBlind({...newBlind, bigBlind: parseInt(e.target.value)})}
                          className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          min={0}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Duración */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Duración (minutos)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <input
                        type="number"
                        value={newBlind.duration}
                        onChange={(e) => setNewBlind({...newBlind, duration: parseInt(e.target.value)})}
                        className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        min={1}
                      />
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-100 p-4 border border-blue-200/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30"></div>
                    <div className="relative flex items-start space-x-3">
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">Configuración de Blinds</h4>
                        <p className="text-xs text-blue-700">
                          Los blinds determinan el ritmo del torneo. Niveles más largos permiten más juego, mientras que niveles cortos aceleran la acción.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      disabled={isLoading}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddBlind}
                      disabled={isLoading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Agregando...</span>
                        </div>
                      ) : (
                        'Agregar Nivel'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 