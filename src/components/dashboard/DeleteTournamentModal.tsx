'use client'

import { useState } from 'react'
import { Tournament } from '@/types'

interface DeleteTournamentModalProps {
  tournament: Tournament
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

export default function DeleteTournamentModal({ 
  tournament, 
  onClose, 
  onConfirm, 
  isDeleting 
}: DeleteTournamentModalProps) {
  const [tournamentName, setTournamentName] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (tournamentName !== tournament.name) {
      setError(`El nombre no coincide. Por favor escribe exactamente: "${tournament.name}"`)
      return
    }
    setError('')
    onConfirm()
  }

  const handleClose = () => {
    setTournamentName('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl max-w-lg w-full border border-white/20">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-pink-50/30"></div>
        <div className="relative p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Eliminar Torneo</h2>
                <p className="text-gray-600 mt-1">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-pink-50/50"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg shadow-md">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmación Requerida</h3>
                </div>
                
                <p className="text-sm text-gray-700 mb-4">
                  ¿Estás seguro de que quieres eliminar completamente el torneo <strong className="text-red-600">"{tournament.name}"</strong>?
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-pink-50/50"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg shadow-md">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Advertencia</h3>
                </div>
                
                <p className="text-sm text-red-700 mb-3">
                  <strong>⚠️ Esta acción eliminará permanentemente:</strong>
                </p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>El torneo y toda su configuración</li>
                  <li>Todos los jugadores y sus datos</li>
                  <li>Todas las transacciones (recompras, add-ons, bonos)</li>
                  <li>Todos los pagos registrados</li>
                  <li>El historial completo de acciones</li>
                  <li>Todos los snapshots y backups</li>
                  <li>La estructura de blinds y premios</li>
                </ul>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Para confirmar, escribe el nombre del torneo:
                </label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => {
                    setTournamentName(e.target.value)
                    setError('')
                  }}
                  placeholder={`Escribe: "${tournament.name}"`}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white ${
                    error ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isDeleting}
                />
                {error && (
                  <p className="text-sm text-red-600 mt-2">{error}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-medium">Cancelar</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting || tournamentName !== tournament.name}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="font-medium">Eliminando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="font-medium">Eliminar Definitivamente</span>
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