'use client'

import { useState, useEffect } from 'react'
import { ClubPlayer } from '@/types'
import Toast from '../ui/Toast'
import BonusSelector from './BonusSelector'

interface AddPlayerModalProps {
  onClose: () => void
  onSubmit: (playerData: any) => void
  tournament?: {
    bonuses: any[]
    buyIn: number
    initialStack: number
    doubleRebuy?: boolean
    doubleRebuyPrice?: number
    doubleRebuyChips?: number
    doubleBuyIn?: boolean
    doubleBuyInPrice?: number
    doubleBuyInChips?: number
  }
}

export default function AddPlayerModal({ onClose, onSubmit, tournament }: AddPlayerModalProps) {
  const [step, setStep] = useState<'init' | 'existing' | 'new'>('init')
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<ClubPlayer[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedBonuses, setSelectedBonuses] = useState<string[]>([])
  const [enableDoubleRebuy, setEnableDoubleRebuy] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null)

  // Debug: verificar información del torneo
  console.log('AddPlayerModal - tournament:', tournament)
  console.log('AddPlayerModal - bonuses:', tournament?.bonuses)

  // Calcular fichas iniciales según buy-in doble
  const getInitialChips = () => {
    if (!tournament) return 0
    return enableDoubleRebuy && tournament.doubleBuyIn 
      ? (tournament.doubleBuyInChips || tournament.initialStack)
      : tournament.initialStack
  }

  // Calcular precio inicial según buy-in doble
  const getInitialPrice = () => {
    if (!tournament) return 0
    return enableDoubleRebuy && tournament.doubleBuyIn 
      ? (tournament.doubleBuyInPrice || tournament.buyIn)
      : tournament.buyIn
  }

  // Calcular total de fichas incluyendo bonos
  const calculateTotalChips = () => {
    const baseChips = getInitialChips()
    const bonusChips = selectedBonuses.reduce((total, bonusId) => {
      const bonus = tournament?.bonuses.find(b => b.id === bonusId)
      return total + (bonus?.chips || 0)
    }, 0)
    return baseChips + bonusChips
  }

  // Calcular total de precio incluyendo bonos
  const calculateTotalPrice = () => {
    const basePrice = getInitialPrice()
    const bonusPrice = selectedBonuses.reduce((total, bonusId) => {
      const bonus = tournament?.bonuses.find(b => b.id === bonusId)
      return total + (bonus?.price || 0)
    }, 0)
    return basePrice + bonusPrice
  }

  // Buscar jugadores existentes
  useEffect(() => {
    if (step !== 'existing' || search.length < 1) {
      setSuggestions([])
      return
    }
    setLoading(true)
    fetch(`/api/club-players?q=${encodeURIComponent(search)}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setSuggestions(data))
      .finally(() => setLoading(false))
  }, [search, step])

  const handleSelectId = (id: string) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])
  }

  const handleAddExisting = () => {
    if (selectedIds.length === 0) {
      setToast({ message: 'Selecciona al menos un jugador', type: 'error' })
      return
    }
    
    // Enviar uno por uno con datos completos
    let successCount = 0
    let errorCount = 0
    
    const addPlayers = async () => {
      for (const id of selectedIds) {
        const player = suggestions.find(p => p.id === id)
        if (player) {
          try {
            const playerData = {
              clubPlayerId: player.id,
              name: player.name,
              email: player.email || '',
              phone: player.phone || '',
              selectedBonuses,
              enableDoubleRebuy
            }
            onSubmit(playerData)
            successCount++
          } catch (error) {
            errorCount++
            console.error('Error agregando jugador:', error)
          }
        }
      }
      
      if (errorCount > 0) {
        setToast({ 
          message: `Agregados ${successCount} jugadores. ${errorCount} errores.`, 
          type: errorCount === selectedIds.length ? 'error' : 'info' 
        })
      } else {
        setToast({ message: `${successCount} jugadores agregados exitosamente`, type: 'success' })
      }
      onClose()
    }
    
    addPlayers()
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setToast({ message: 'El nombre es obligatorio', type: 'error' })
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/club-players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        const newPlayer = await res.json()
        setToast({ message: 'Jugador creado y asignado', type: 'success' })
        onSubmit({ 
          clubPlayerId: newPlayer.id,
          name: newPlayer.name,
          email: newPlayer.email || '',
          phone: newPlayer.phone || '',
          selectedBonuses,
          enableDoubleRebuy
        })
        onClose()
      } else {
        const err = await res.json()
        setToast({ message: err.error || 'Error al crear jugador', type: 'error' })
      }
    } catch (error) {
      console.error('Error de conexión:', error)
      setToast({ message: 'Error de conexión', type: 'error' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto border border-white/20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
        <div className="relative p-8">
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
          
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Agregar Jugador</h2>
                <p className="text-gray-600 mt-1">Selecciona cómo quieres agregar jugadores al torneo</p>
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

          {step === 'init' && (
            <div className="space-y-4">
              <button 
                onClick={() => setStep('existing')} 
                className="w-full flex items-center justify-center space-x-3 p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-lg font-semibold">Agregar Jugador Existente</span>
              </button>
              <button 
                onClick={() => setStep('new')} 
                className="w-full flex items-center justify-center space-x-3 p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-lg font-semibold">Crear Nuevo Jugador</span>
              </button>
            </div>
          )}

          {step === 'existing' && (
            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    autoFocus
                  />
                </div>
                <button 
                  onClick={() => setStep('init')} 
                  className="inline-flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="font-medium">Volver</span>
                </button>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50"></div>
                <div className="relative overflow-x-auto max-h-64">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seleccionar</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {loading && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                            <div className="flex items-center justify-center space-x-2">
                              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>Buscando...</span>
                            </div>
                          </td>
                        </tr>
                      )}
                      {!loading && suggestions.length === 0 && search.length > 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                            <div className="flex items-center justify-center space-x-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.334A7.97 7.97 0 0012 5c-2.34 0-4.29 1.009-5.824 2.562" />
                              </svg>
                              <span>No hay jugadores encontrados</span>
                            </div>
                          </td>
                        </tr>
                      )}
                      {!loading && suggestions.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(p.id)} 
                              onChange={() => handleSelectId(p.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{p.email || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{p.phone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Sección de selección de bonos */}
              {tournament && tournament.bonuses && tournament.bonuses.length > 0 ? (
                <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 to-emerald-50/50"></div>
                  <div className="relative">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Bonos para Compra Inicial</h3>
                    </div>
                    <BonusSelector
                      bonuses={tournament.bonuses}
                      selectedBonuses={selectedBonuses}
                      onSelectionChange={setSelectedBonuses}
                      context="buyIn"
                      buyInPrice={getInitialPrice()}
                      initialStack={getInitialChips()}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-gray-100/50"></div>
                  <div className="relative text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.334A7.97 7.97 0 0012 5c-2.34 0-4.29 1.009-5.824 2.562" />
                    </svg>
                    <p className="text-gray-500 text-sm">
                      {!tournament ? 'No hay información del torneo' : 
                       !tournament.bonuses ? 'No hay bonos configurados' :
                       'No hay bonos disponibles para compra inicial'}
                    </p>
                  </div>
                </div>
              )}

              {/* Sección de recompra doble */}
              {tournament && tournament.doubleRebuy && (
                <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-red-50/50"></div>
                  <div className="relative">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-md">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Acceso a Recompra Doble</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="enableDoubleRebuy"
                          checked={enableDoubleRebuy}
                          onChange={(e) => setEnableDoubleRebuy(e.target.checked)}
                          className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                        />
                        <label htmlFor="enableDoubleRebuy" className="text-sm font-medium text-gray-700 cursor-pointer">
                          Habilitar acceso a recompra doble
                        </label>
                      </div>
                      
                      {enableDoubleRebuy && tournament.doubleRebuyPrice && tournament.doubleRebuyChips && (
                        <div className="bg-white/80 rounded-lg p-4 border border-white/30">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Precio por Recompra</p>
                              <p className="text-sm font-semibold text-gray-900">${tournament.doubleRebuyPrice}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fichas por Recompra</p>
                              <p className="text-sm font-semibold text-gray-900">{tournament.doubleRebuyChips.toLocaleString()}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            El jugador podrá realizar recompras dobles durante el torneo cuando sea necesario
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sección de resumen total */}
              <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50"></div>
                <div className="relative">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Resumen Total</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/80 rounded-lg p-4 border border-white/30">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Buy-in</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {enableDoubleRebuy && tournament?.doubleBuyIn ? 'Doble' : 'Sencillo'}
                        </p>
                      </div>
                      <div className="bg-white/80 rounded-lg p-4 border border-white/30">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Base</p>
                        <p className="text-sm font-semibold text-gray-900">${getInitialPrice().toLocaleString()}</p>
                      </div>
                      <div className="bg-white/80 rounded-lg p-4 border border-white/30">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fichas Base</p>
                        <p className="text-sm font-semibold text-gray-900">{getInitialChips().toLocaleString()}</p>
                      </div>
                      <div className="bg-white/80 rounded-lg p-4 border border-white/30">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bonos Seleccionados</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedBonuses.length}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium opacity-90">Total a Pagar</p>
                          <p className="text-2xl font-bold">${calculateTotalPrice().toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium opacity-90">Fichas a Recibir</p>
                          <p className="text-2xl font-bold">{calculateTotalChips().toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={handleAddExisting} 
                  disabled={selectedIds.length === 0}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-medium">Agregar Seleccionados ({selectedIds.length})</span>
                </button>
              </div>
            </div>
          )}

          {step === 'new' && (
            <form onSubmit={handleCreateNew} className="space-y-6">
              <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 to-emerald-50/50"></div>
                <div className="relative space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Información del Jugador</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre * <span className="text-red-500">(Obligatorio)</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      autoComplete="off"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                      required
                      placeholder="Nombre completo del jugador"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-gray-500">(Opcional, debe ser único)</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono <span className="text-gray-500">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                      placeholder="123-456-7890"
                    />
                  </div>
                </div>
              </div>
              
              {/* Sección de selección de bonos para nuevo jugador */}
              {tournament && tournament.bonuses && tournament.bonuses.length > 0 ? (
                <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 to-emerald-50/50"></div>
                  <div className="relative">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Bonos para Compra Inicial</h3>
                    </div>
                    <BonusSelector
                      bonuses={tournament.bonuses}
                      selectedBonuses={selectedBonuses}
                      onSelectionChange={setSelectedBonuses}
                      context="buyIn"
                      buyInPrice={getInitialPrice()}
                      initialStack={getInitialChips()}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-gray-100/50"></div>
                  <div className="relative text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.334A7.97 7.97 0 0012 5c-2.34 0-4.29 1.009-5.824 2.562" />
                    </svg>
                    <p className="text-gray-500 text-sm">
                      {!tournament ? 'No hay información del torneo' : 
                       !tournament.bonuses ? 'No hay bonos configurados' :
                       'No hay bonos disponibles para compra inicial'}
                    </p>
                  </div>
                </div>
              )}

              {/* Sección de recompra doble para nuevo jugador */}
              {tournament && tournament.doubleRebuy && (
                <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-red-50/50"></div>
                  <div className="relative">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-md">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Acceso a Recompra Doble</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="enableDoubleRebuyNew"
                          checked={enableDoubleRebuy}
                          onChange={(e) => setEnableDoubleRebuy(e.target.checked)}
                          className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                        />
                        <label htmlFor="enableDoubleRebuyNew" className="text-sm font-medium text-gray-700 cursor-pointer">
                          Habilitar acceso a recompra doble
                        </label>
                      </div>
                      
                      {enableDoubleRebuy && tournament.doubleRebuyPrice && tournament.doubleRebuyChips && (
                        <div className="bg-white/80 rounded-lg p-4 border border-white/30">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Precio por Recompra</p>
                              <p className="text-sm font-semibold text-gray-900">${tournament.doubleRebuyPrice}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fichas por Recompra</p>
                              <p className="text-sm font-semibold text-gray-900">{tournament.doubleRebuyChips.toLocaleString()}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            El jugador podrá realizar recompras dobles durante el torneo cuando sea necesario
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sección de resumen total para nuevo jugador */}
              <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50"></div>
                <div className="relative">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Resumen Total</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/80 rounded-lg p-4 border border-white/30">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Buy-in</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {enableDoubleRebuy && tournament?.doubleBuyIn ? 'Doble' : 'Sencillo'}
                        </p>
                      </div>
                      <div className="bg-white/80 rounded-lg p-4 border border-white/30">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Base</p>
                        <p className="text-sm font-semibold text-gray-900">${getInitialPrice().toLocaleString()}</p>
                      </div>
                      <div className="bg-white/80 rounded-lg p-4 border border-white/30">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fichas Base</p>
                        <p className="text-sm font-semibold text-gray-900">{getInitialChips().toLocaleString()}</p>
                      </div>
                      <div className="bg-white/80 rounded-lg p-4 border border-white/30">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bonos Seleccionados</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedBonuses.length}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium opacity-90">Total a Pagar</p>
                          <p className="text-2xl font-bold">${calculateTotalPrice().toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium opacity-90">Fichas a Recibir</p>
                          <p className="text-2xl font-bold">{calculateTotalChips().toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button 
                  type="button" 
                  onClick={() => setStep('init')} 
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="font-medium">Volver</span>
                </button>
                <button 
                  type="submit" 
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={creating || !form.name.trim()}
                >
                  {creating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="font-medium">Guardando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="font-medium">Agregar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
} 