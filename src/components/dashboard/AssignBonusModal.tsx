'use client'

import { useState } from 'react'
import { Player, Bonus } from '@/types'
import LoadingSpinner from '../ui/LoadingSpinner'

interface AssignBonusModalProps {
  player: Player
  bonuses: Bonus[]
  onClose: () => void
  onAssign: (bonusId: string) => Promise<void>
}

export default function AssignBonusModal({ player, bonuses, onClose, onAssign }: AssignBonusModalProps) {
  const [selectedBonus, setSelectedBonus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleAssign = async () => {
    if (!selectedBonus) return
    
    setLoading(true)
    try {
      await onAssign(selectedBonus)
      onClose()
    } catch (error) {
      console.error('Error asignando bono:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl max-w-lg w-full border border-white/20">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-emerald-50/30"></div>
        <div className="relative p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Asignar Bono</h2>
                <p className="text-gray-600 mt-1">Selecciona un bono para {player.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!bonuses || bonuses.length === 0 ? (
            <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-gray-100/50"></div>
              <div className="relative text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.334A7.97 7.97 0 0012 5c-2.34 0-4.29 1.009-5.824 2.562" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay bonos disponibles</h3>
                <p className="text-gray-500">No hay bonos configurados para este torneo.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50"></div>
                <div className="relative">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Seleccionar Bono</h3>
                  </div>
                  
                  <select
                    value={selectedBonus}
                    onChange={(e) => setSelectedBonus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  >
                    <option value="">Selecciona un bono...</option>
                    {bonuses?.map((bonus) => (
                      <option key={bonus.id} value={bonus.id}>
                        {bonus.name} - {bonus.chips.toLocaleString()} fichas
                        {bonus.price > 0 ? ` ($${bonus.price})` : ' (Gratis)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedBonus && (
                <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 to-emerald-50/50"></div>
                  <div className="relative">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Detalles del Bono</h3>
                    </div>
                    
                    {(() => {
                      const bonus = bonuses?.find(b => b.id === selectedBonus)
                      if (!bonus) return null
                      return (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/80 rounded-lg p-3 border border-white/30">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</p>
                              <p className="text-sm font-semibold text-gray-900">{bonus.name}</p>
                            </div>
                            <div className="bg-white/80 rounded-lg p-3 border border-white/30">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fichas</p>
                              <p className="text-sm font-semibold text-gray-900">{bonus.chips.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/80 rounded-lg p-3 border border-white/30">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {bonus.price > 0 ? `$${bonus.price}` : 'Gratis'}
                              </p>
                            </div>
                            <div className="bg-white/80 rounded-lg p-3 border border-white/30">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nuevo Stack</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {(player.chips + bonus.chips).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="font-medium">Cancelar</span>
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!selectedBonus || loading}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="font-medium">Asignando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Asignar Bono</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 