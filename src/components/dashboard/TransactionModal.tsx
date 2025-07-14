'use client'

import { useState, useEffect } from 'react'
import { Tournament, Bonus, Player } from '@/types'
import BonusSelector from './BonusSelector'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TransactionData) => void
  tournament: Tournament
  player: Player
  type: 'buyIn' | 'rebuy' | 'addOn'
  isDouble?: boolean
  loading?: boolean
}

interface TransactionData {
  type: 'BUY_IN' | 'REBUY' | 'ADD_ON'
  isDouble: boolean
  selectedBonuses: string[]
  amount: number
  chips: number
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  tournament,
  player,
  type,
  isDouble = false,
  loading = false
}: TransactionModalProps) {
  const [selectedBonuses, setSelectedBonuses] = useState<string[]>([])
  const [isDoubleTransaction, setIsDoubleTransaction] = useState(isDouble)

  // Calcular valores según el tipo de transacción
  const getTransactionValues = () => {
    if (type === 'buyIn') {
      if (isDoubleTransaction && tournament.doubleBuyIn) {
        return {
          amount: tournament.doubleBuyInPrice || tournament.buyIn,
          chips: tournament.doubleBuyInChips || tournament.initialStack
        }
      }
      return {
        amount: tournament.buyIn,
        chips: tournament.initialStack
      }
    } else if (type === 'addOn') {
      return {
        amount: tournament.addOn || 0,
        chips: tournament.addOnChips || 0
      }
    } else {
      if (isDoubleTransaction && tournament.doubleRebuy) {
        return {
          amount: tournament.doubleRebuyPrice || tournament.rebuy || 0,
          chips: tournament.doubleRebuyChips || tournament.rebuyChips || 0
        }
      }
      return {
        amount: tournament.rebuy || 0,
        chips: tournament.rebuyChips || tournament.initialStack
      }
    }
  }

  const { amount, chips } = getTransactionValues()

  // Filtrar bonos disponibles según el contexto
  const availableBonuses = tournament.bonuses.filter(bonus => {
    if (type === 'buyIn') {
      return bonus.availableInBuyIn
    } else if (type === 'addOn') {
      return bonus.availableInAddOn
    } else {
      return bonus.availableInRebuy
    }
  })

  const handleBonusToggle = (bonusId: string) => {
    setSelectedBonuses(prev => 
      prev.includes(bonusId) 
        ? prev.filter(id => id !== bonusId)
        : [...prev, bonusId]
    )
  }

  const handleSubmit = () => {
    const transactionData: TransactionData = {
      type: type === 'buyIn' ? 'BUY_IN' : type === 'addOn' ? 'ADD_ON' : 'REBUY',
      isDouble: isDoubleTransaction,
      selectedBonuses,
      amount,
      chips
    }
    onSubmit(transactionData)
  }

  const handleClose = () => {
    setSelectedBonuses([])
    setIsDoubleTransaction(isDouble)
    onClose()
  }

  // Calcular total de fichas incluyendo bonos
  const totalChips = chips + selectedBonuses.reduce((total, bonusId) => {
    const bonus = tournament.bonuses.find(b => b.id === bonusId)
    return total + (bonus?.chips || 0)
  }, 0)

  // Calcular total de precio incluyendo bonos
  const totalAmount = amount + selectedBonuses.reduce((total, bonusId) => {
    const bonus = tournament.bonuses.find(b => b.id === bonusId)
    return total + (bonus?.price || 0)
  }, 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl mx-auto">
        {/* Overlay con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl"></div>
        
        {/* Contenido del modal */}
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  {type === 'buyIn' ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {type === 'buyIn' ? 'Compra Inicial' : 'Recompra'} - {player.name}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {type === 'buyIn' ? 'Configurar compra inicial del jugador' : 'Configurar recompra del jugador'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
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
            {/* Información del jugador */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 p-6 border border-gray-200/50">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Información del Jugador</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/80 rounded-xl p-4 border border-white/50">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</p>
                    <p className="text-sm font-semibold text-gray-900">{player.name}</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4 border border-white/50">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fichas Actuales</p>
                    <p className="text-sm font-semibold text-gray-900">{player.chips.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuración de la transacción */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-50 to-emerald-100 p-6 border border-green-200/50">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-emerald-50/30"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Configuración de la Transacción</h4>
                </div>
                
                {/* Opción de doble compra */}
                {type === 'buyIn' && tournament.doubleBuyIn && (
                  <div className="bg-white/80 rounded-xl p-4 border border-white/50 mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isDoubleTransaction}
                        onChange={(e) => setIsDoubleTransaction(e.target.checked)}
                        className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 transition-all duration-200"
                      />
                      <label className="text-sm font-medium text-gray-700 cursor-pointer">
                        Compra inicial doble
                      </label>
                    </div>
                  </div>
                )}

                {type === 'rebuy' && tournament.doubleRebuy && (
                  <div className="bg-white/80 rounded-xl p-4 border border-white/50 mb-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isDoubleTransaction}
                          onChange={(e) => setIsDoubleTransaction(e.target.checked)}
                          className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 transition-all duration-200"
                        />
                        <label className="text-sm font-medium cursor-pointer text-gray-700">
                          Recompra doble
                        </label>
                      </div>
                      <div className="flex items-center space-x-2 ml-8">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-blue-600">
                          Cualquier jugador puede hacer recompras dobles independientemente de su buy-in inicial
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add-on no tiene opción de doble */}
                {type === 'addOn' && (
                  <div className="bg-white/80 rounded-xl p-4 border border-white/50 mb-4">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <label className="text-sm font-medium text-gray-700">
                        Add-on (solo una vez por jugador)
                      </label>
                    </div>
                  </div>
                )}

                {/* Resumen de la transacción */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-200/50">
                  <h5 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Resumen de la Transacción</span>
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/80 rounded-lg p-3 border border-white/50">
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Tipo</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {type === 'buyIn' ? 'Compra Inicial' : type === 'addOn' ? 'Add-on' : 'Recompra'}
                        {isDoubleTransaction ? ' (Doble)' : ''}
                      </p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 border border-white/50">
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Precio Base</p>
                      <p className="text-sm font-semibold text-gray-900">${amount.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 border border-white/50">
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Fichas Base</p>
                      <p className="text-sm font-semibold text-gray-900">{chips.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selección de bonos */}
            {availableBonuses.length > 0 && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-50 to-pink-100 p-6 border border-purple-200/50">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-pink-50/30"></div>
                <div className="relative">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Bonos Disponibles</h4>
                  </div>
                  <BonusSelector
                    bonuses={tournament.bonuses}
                    selectedBonuses={selectedBonuses}
                    onSelectionChange={setSelectedBonuses}
                    context={type}
                    buyInPrice={amount}
                    initialStack={chips}
                  />
                </div>
              </div>
            )}

            {/* Resumen final */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 to-green-100 p-6 border border-emerald-200/50">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-green-50/30"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Resumen Final</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/80 rounded-xl p-4 border border-white/50">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total a Pagar</p>
                    <p className="text-xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4 border border-white/50">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Fichas a Recibir</p>
                    <p className="text-xl font-bold text-gray-900">{totalChips.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-white/80 rounded-xl p-4 border border-white/50">
                  <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">Bonos Seleccionados</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedBonuses.length > 0 
                      ? selectedBonuses.map(id => {
                          const bonus = tournament.bonuses.find(b => b.id === id)
                          return bonus?.name
                        }).join(', ')
                      : 'Ninguno'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Procesando...</span>
                  </div>
                ) : (
                  `Confirmar ${type === 'buyIn' ? 'Compra' : 'Recompra'}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 