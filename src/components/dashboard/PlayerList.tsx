'use client'

import { useState, useRef, useEffect } from 'react'
import { Tournament, Player, User, ClubPlayer } from '@/types'
import AddPlayerModal from './AddPlayerModal'
import AssignBonusModal from './AssignBonusModal'
import TransactionModal from './TransactionModal'
import Toast from '../ui/Toast'

interface PlayerPayment {
  id: string
  amount: number
  method: string
  reference?: string | null
  paidAt: string
  notes?: string | null
}

interface PlayerListProps {
  tournament: Tournament
  user: User
  onUpdate: () => void
}

export default function PlayerList({ tournament, user, onUpdate }: PlayerListProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBonusModal, setShowBonusModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'warning' | 'info' } | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState<{ player: Player | null; open: boolean }>({ player: null, open: false })
  const [payments, setPayments] = useState<{ [playerId: string]: PlayerPayment[] }>({})
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: '', reference: '', notes: '' })
  const [loadingPayment, setLoadingPayment] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ player: Player | null; open: boolean }>({ player: null, open: false })
  const [deletingPlayer, setDeletingPlayer] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState<{ 
    player: Player | null; 
    type: 'buyIn' | 'rebuy' | 'addOn'; 
    open: boolean 
  }>({ player: null, type: 'rebuy', open: false })
  const [processingTransaction, setProcessingTransaction] = useState(false)

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openMenu && menuRefs.current[openMenu] && !menuRefs.current[openMenu]?.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenu])

  const handleAddPlayer = async (playerData: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(playerData)
      })

      if (response.ok) {
        const result = await response.json()
        onUpdate()
        setShowAddModal(false)
        
        setToast({ message: 'Jugador agregado exitosamente', type: 'success' })
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Error al agregar jugador', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Error de conexión', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePlayer = async (playerId: string, updates: any) => {
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/players/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        onUpdate()
        setToast({ message: 'Jugador actualizado correctamente', type: 'success' })
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Error al actualizar jugador', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Error de conexión', type: 'error' })
    }
  }

  const handleDeletePlayer = async (playerId: string) => {
    setDeletingPlayer(true)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/players/${playerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        onUpdate()
        setToast({ message: 'Jugador eliminado correctamente', type: 'success' })
        setShowDeleteConfirm({ player: null, open: false })
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Error al eliminar jugador', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Error de conexión', type: 'error' })
    } finally {
      setDeletingPlayer(false)
    }
  }

  const handleEliminatePlayer = async (playerId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/players/${playerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'eliminate' })
      })

      if (response.ok) {
        onUpdate()
        setToast({ message: 'Jugador marcado como eliminado', type: 'success' })
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Error al marcar como eliminado', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Error de conexión', type: 'error' })
    }
  }

  const handleReactivatePlayer = async (playerId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/players/${playerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'reactivate' })
      })

      if (response.ok) {
        onUpdate()
        setToast({ message: 'Jugador reactivado exitosamente', type: 'success' })
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Error al reactivar jugador', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Error de conexión', type: 'error' })
    }
  }

  const handleConfirmDelete = (player: Player) => {
    setShowDeleteConfirm({ player, open: true })
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm({ player: null, open: false })
  }

  const handleAssignBonus = async (bonusId: string) => {
    if (!selectedPlayer) return

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/players/${selectedPlayer.id}/bonuses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bonusId })
      })

      if (response.ok) {
        onUpdate()
        setToast({ message: 'Bono asignado correctamente', type: 'success' })
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Error al asignar bono', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Error de conexión', type: 'error' })
    }
  }

  // Nueva función para quitar la última recompra/add-on
  const handleRemoveTransaction = async (playerId: string, type: 'rebuy' | 'add-on') => {
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/players/${playerId}/transactions/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      if (response.ok) {
        onUpdate()
        setToast({ message: 'Transacción eliminada correctamente', type: 'success' })
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Error al quitar transacción', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Error de conexión', type: 'error' })
    }
  }

  // Nueva función para agregar recompra sencilla/doble
  const handleRebuy = async (playerId: string, type: 'single' | 'double') => {
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/players/${playerId}/rebuy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      if (response.ok) {
        onUpdate()
        setToast({ message: 'Recompra realizada correctamente', type: 'success' })
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Error al agregar recompra', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Error de conexión', type: 'error' })
    }
  }

  // Funciones para el nuevo modal de transacciones
  const handleOpenTransactionModal = (player: Player, type: 'buyIn' | 'rebuy' | 'addOn') => {
    setShowTransactionModal({ player, type, open: true })
  }

  const handleCloseTransactionModal = () => {
    setShowTransactionModal({ player: null, type: 'buyIn', open: false })
  }

  const handleProcessTransaction = async (transactionData: any) => {
    if (!showTransactionModal.player) return

    setProcessingTransaction(true)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/players/${showTransactionModal.player.id}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      })

      if (response.ok) {
        onUpdate()
        handleCloseTransactionModal()
        setToast({ message: 'Transacción procesada correctamente', type: 'success' })
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Error al procesar transacción', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Error de conexión', type: 'error' })
    } finally {
      setProcessingTransaction(false)
    }
  }

  const activePlayers = tournament.players.filter(p => !p.isEliminated)
  const eliminatedPlayers = tournament.players.filter(p => p.isEliminated)

  const fetchPayments = async (playerId: string) => {
    const res = await fetch(`/api/tournaments/${tournament.id}/players/${playerId}/payments`)
    if (res.ok) {
      const data = await res.json()
      setPayments(p => ({ ...p, [playerId]: data }))
    }
  }

  const handleOpenPaymentModal = (player: Player) => {
    setShowPaymentModal({ player, open: true })
    fetchPayments(player.id)
  }
  const handleClosePaymentModal = () => {
    setShowPaymentModal({ player: null, open: false })
    setPaymentForm({ amount: '', method: '', reference: '', notes: '' })
  }
  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }
  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showPaymentModal.player) return
    setLoadingPayment(true)
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/players/${showPaymentModal.player.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          method: paymentForm.method,
          reference: paymentForm.reference,
          notes: paymentForm.notes
        })
      })
      if (res.ok) {
        setToast({ message: 'Pago registrado', type: 'success' })
        fetchPayments(showPaymentModal.player.id)
        setPaymentForm({ amount: '', method: '', reference: '', notes: '' })
      } else {
        const err = await res.json()
        setToast({ message: err.error || 'Error al registrar pago', type: 'error' })
      }
    } catch {
      setToast({ message: 'Error de conexión', type: 'error' })
    } finally {
      setLoadingPayment(false)
    }
  }

  // Función para calcular la deuda total de un jugador
  function calcularDeuda(player: Player, tournament: Tournament): number {
    let deuda = 0
    
    // Calcular deuda basándose en las transacciones reales
    for (const transaction of player.transactions) {
      if (transaction.type === 'BUY_IN') {
        // Para buy-in, usar el monto real de la transacción (que incluye bonos)
        deuda += transaction.amount
      } else if (transaction.type === 'REBUY') {
        // Para rebuys, usar el monto real de la transacción
        deuda += transaction.amount
      } else if (transaction.type === 'ADD_ON') {
        // Para add-ons, usar el monto real de la transacción
        deuda += transaction.amount
      } else if (transaction.type === 'OTHER' && transaction.description && transaction.description.startsWith('Bono:')) {
        // Para bonos individuales, usar el monto real
        deuda += transaction.amount
      }
    }
    
    return deuda
  }

  function calcularPagado(player: Player): number {
    const pagos = payments[player.id] || []
    return pagos.reduce((sum, p) => sum + p.amount, 0)
  }

  // Permisos
  const puedeEditar = user.id === tournament.organizerId || user.role === 'ADMIN' || user.role === 'STAFF'

  return (
    <div className="space-y-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {/* Header y botón de agregar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Jugadores</h2>
            <p className="text-sm text-gray-600">Gestiona los jugadores del torneo</p>
          </div>
        </div>
        
        {puedeEditar && (
          <button
            onClick={() => setShowAddModal(true)}
            className="add-player-btn inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="font-semibold">Agregar Jugador</span>
          </button>
        )}
      </div>

      {/* Jugadores Activos */}
      {activePlayers.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Jugadores Activos</h3>
                  <p className="text-sm text-gray-600">{activePlayers.length} jugadores en el torneo</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {activePlayers.filter(p => !p.isEliminated).length} Activos
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {activePlayers.map((player) => {
                // Contar recompras basándose en las transacciones reales
                const rebuys = player.transactions.filter(t => t.type === 'REBUY' && (!t.description || !t.description.includes('doble'))).length
                const doubleRebuys = player.transactions.filter(t => t.type === 'REBUY' && t.description && t.description.includes('doble')).length
                const deuda = calcularDeuda(player, tournament)
                const pagado = calcularPagado(player)
                const balance = deuda - pagado
                const isExpanded = openMenu === player.id

                return (
                  <div key={player.id} className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 transition-all duration-200 hover:shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-gray-100/50"></div>
                    <div className="relative p-6">
                      {/* Información principal del jugador */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold text-lg">
                                {player.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{player.name}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              {player.user && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Registrado
                                </span>
                              )}
                              {player.hasDoubleRebuyAccess && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Doble Recompra
                                </span>
                              )}
                            </div>
                            {player.email && (
                              <p className="text-sm text-gray-500 mt-1">{player.email}</p>
                            )}
                          </div>
                        </div>

                        {/* Estadísticas principales */}
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{player.chips.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">Fichas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">{rebuys}</div>
                            <div className="text-xs text-gray-500">Recompras</div>
                          </div>
                          {tournament.doubleRebuy && (
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">{doubleRebuys}</div>
                              <div className="text-xs text-gray-500">Dobles</div>
                            </div>
                          )}
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">{player.addOns}</div>
                            <div className="text-xs text-gray-500">Add-ons</div>
                          </div>
                        </div>

                        {/* Botón de acciones */}
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">${deuda.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">Deuda Total</div>
                          </div>
                          <button
                            onClick={() => setOpenMenu(openMenu === player.id ? null : player.id)}
                            className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Información financiera */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-white/80 rounded-lg p-3 border border-white/30">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pagos</div>
                          <div className="text-sm font-semibold text-gray-900">
                            ${pagado.toFixed(2)} / ${deuda.toFixed(2)}
                          </div>
                          <button 
                            onClick={() => handleOpenPaymentModal(player)} 
                            className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                          >
                            Ver / Registrar
                          </button>
                        </div>
                        <div className="bg-white/80 rounded-lg p-3 border border-white/30">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</div>
                          <div className={`text-sm font-semibold ${balance === 0 ? 'text-green-600' : balance < 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            ${balance.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-white/80 rounded-lg p-3 border border-white/30">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</div>
                          <div className="text-sm font-semibold text-green-600">
                            Activo
                          </div>
                        </div>
                      </div>

                      {/* Panel de acciones expandible */}
                      {isExpanded && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-white/30">
                          <div className="flex items-center space-x-2 mb-4">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <h5 className="text-sm font-semibold text-gray-900">Acciones Disponibles</h5>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {/* Acciones principales */}
                            <div className="space-y-2">
                              <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</h6>
                              <div className="space-y-1">
                                <button 
                                  onClick={() => { handleOpenTransactionModal(player, 'rebuy'); setOpenMenu(null) }}
                                  className="w-full text-left px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition-colors"
                                >
                                  <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Re buy</span>
                                  </div>
                                </button>
                                <button 
                                  onClick={() => { handleOpenTransactionModal(player, 'addOn'); setOpenMenu(null) }}
                                  className="w-full text-left px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition-colors"
                                >
                                  <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span>Add on</span>
                                  </div>
                                </button>
                              </div>
                            </div>

                            {/* Eliminar transacciones */}
                            <div className="space-y-2">
                              <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Eliminar</h6>
                              <div className="space-y-1">
                                <button 
                                  onClick={() => { handleRemoveTransaction(player.id, 'rebuy'); setOpenMenu(null) }}
                                  className="w-full text-left px-3 py-2 text-sm bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg transition-colors"
                                >
                                  <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                    <span>Eliminar re buy</span>
                                  </div>
                                </button>
                                <button 
                                  onClick={() => { handleRemoveTransaction(player.id, 'add-on'); setOpenMenu(null) }}
                                  className="w-full text-left px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
                                >
                                  <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                    <span>Eliminar add on</span>
                                  </div>
                                </button>
                              </div>
                            </div>

                            {/* Gestión del jugador */}
                            <div className="space-y-2">
                              <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gestión</h6>
                              <div className="space-y-1">
                                <button 
                                  onClick={() => { handleEliminatePlayer(player.id); setOpenMenu(null) }}
                                  className="w-full text-left px-3 py-2 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-colors"
                                >
                                  <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                    </svg>
                                    <span>Eliminar del torneo</span>
                                  </div>
                                </button>
                                <button 
                                  onClick={() => { handleConfirmDelete(player); setOpenMenu(null) }}
                                  className="w-full text-left px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
                                >
                                  <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Eliminar por completo</span>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Jugadores Eliminados */}
      {eliminatedPlayers.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/20 mt-6">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-orange-50/30"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Jugadores Eliminados</h3>
                  <p className="text-sm text-gray-600">{eliminatedPlayers.length} jugadores eliminados</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  {eliminatedPlayers.length} Eliminados
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {eliminatedPlayers.map((player) => (
                <div key={player.id} className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 transition-all duration-200 hover:shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-gray-100/50"></div>
                  <div className="relative p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{player.name}</h4>
                          {player.email && (
                            <p className="text-sm text-gray-500 mt-1">{player.email}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Eliminado
                            </span>
                            {player.position && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {player.position}º Lugar
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Eliminado el</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {player.eliminatedAt ? new Date(player.eliminatedAt).toLocaleDateString('es-ES') : '-'}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              const position = prompt('Posición final:', player.position?.toString() || '')
                              if (position !== null) {
                                handleUpdatePlayer(player.id, { position: parseInt(position) })
                              }
                            }}
                            className="inline-flex items-center px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar Posición
                          </button>
                          <button
                            onClick={() => handleReactivatePlayer(player.id)}
                            className="inline-flex items-center px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reactivar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar jugador */}
      {showAddModal && (
        <AddPlayerModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddPlayer}
          tournament={tournament}
        />
      )}

      {showBonusModal && selectedPlayer && (
        <AssignBonusModal
          player={selectedPlayer}
          bonuses={tournament.bonuses}
          onClose={() => {
            setShowBonusModal(false)
            setSelectedPlayer(null)
          }}
          onAssign={handleAssignBonus}
        />
      )}

      {/* Modal de transacciones */}
      {showTransactionModal.open && showTransactionModal.player && (
        <TransactionModal
          isOpen={showTransactionModal.open}
          onClose={handleCloseTransactionModal}
          onSubmit={handleProcessTransaction}
          tournament={tournament}
          player={showTransactionModal.player}
          type={showTransactionModal.type}
          loading={processingTransaction}
        />
      )}

      {/* Modal de pagos */}
      {showPaymentModal.open && showPaymentModal.player && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg mx-auto">
            {/* Overlay con gradiente */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-3xl"></div>
            
            {/* Contenido del modal */}
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 p-6">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Pagos de {showPaymentModal.player.name}</h3>
                      <p className="text-green-100 text-sm">Gestiona los pagos del jugador</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClosePaymentModal}
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
                {/* Historial de pagos */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 p-6 border border-gray-200/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-gray-100/30"></div>
                  <div className="relative">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Historial de Pagos</h4>
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      {(payments[showPaymentModal.player.id] || []).length === 0 ? (
                        <div className="text-center py-4">
                          <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm text-gray-500">Sin pagos registrados</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(payments[showPaymentModal.player.id] || []).map(p => (
                            <div key={p.id} className="bg-white/80 rounded-lg p-3 border border-white/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-semibold text-gray-900">${p.amount.toFixed(2)}</span>
                                  <span className="text-xs text-gray-500">({p.method})</span>
                                </div>
                                <span className="text-xs text-gray-400">{p.paidAt.slice(0,10)}</span>
                              </div>
                              {(p.reference || p.notes) && (
                                <div className="mt-1 text-xs text-gray-500">
                                  {p.reference && <span className="mr-2">Ref: {p.reference}</span>}
                                  {p.notes && <span>{p.notes}</span>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Formulario de nuevo pago */}
                <form onSubmit={handleRegisterPayment} className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-50 to-emerald-100 p-6 border border-green-200/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-emerald-50/30"></div>
                  <div className="relative">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Registrar Nuevo Pago</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-green-700 uppercase tracking-wider mb-1">Monto</label>
                        <input 
                          type="number" 
                          name="amount" 
                          value={paymentForm.amount} 
                          onChange={handlePaymentChange} 
                          placeholder="0.00" 
                          className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                          required 
                          min="1" 
                          step="0.01" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-green-700 uppercase tracking-wider mb-1">Método</label>
                        <input 
                          type="text" 
                          name="method" 
                          value={paymentForm.method} 
                          onChange={handlePaymentChange} 
                          placeholder="Efectivo" 
                          className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-green-700 uppercase tracking-wider mb-1">Referencia</label>
                        <input 
                          type="text" 
                          name="reference" 
                          value={paymentForm.reference} 
                          onChange={handlePaymentChange} 
                          placeholder="Opcional" 
                          className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-green-700 uppercase tracking-wider mb-1">Notas</label>
                      <input 
                        type="text" 
                        name="notes" 
                        value={paymentForm.notes} 
                        onChange={handlePaymentChange} 
                        placeholder="Notas adicionales" 
                        className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                      />
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end space-x-4">
                      <button 
                        type="button" 
                        onClick={handleClosePaymentModal} 
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
                      >
                        Cerrar
                      </button>
                      <button 
                        type="submit" 
                        disabled={loadingPayment}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingPayment ? (
                          <div className="flex items-center space-x-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Registrando...</span>
                          </div>
                        ) : (
                          'Registrar Pago'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm.open && showDeleteConfirm.player && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg mx-auto">
            {/* Overlay con gradiente */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-pink-500/20 to-orange-500/20 rounded-3xl"></div>
            
            {/* Contenido del modal */}
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-red-600 to-pink-600 p-6">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Confirmar Eliminación</h3>
                      <p className="text-red-100 text-sm">Esta acción no se puede deshacer</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelDelete}
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
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-gray-100/30"></div>
                  <div className="relative">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Jugador a Eliminar</h4>
                    </div>
                    <div className="bg-white/80 rounded-xl p-4 border border-white/50">
                      <p className="text-sm text-gray-700">
                        ¿Estás seguro de que quieres eliminar completamente a <strong className="text-gray-900">{showDeleteConfirm.player.name}</strong> del torneo?
                      </p>
                    </div>
                  </div>
                </div>

                {/* Advertencia */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-50 to-pink-100 p-6 border border-red-200/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-pink-50/30"></div>
                  <div className="relative">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-red-900">⚠️ Advertencia</h4>
                    </div>
                    <div className="bg-white/80 rounded-xl p-4 border border-white/50">
                      <p className="text-sm font-medium text-red-700 mb-3">
                        Esta acción eliminará permanentemente:
                      </p>
                      <ul className="space-y-2 text-sm text-red-700">
                        <li className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Al jugador del torneo</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Todas sus transacciones (recompras, add-ons, bonos)</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Todos sus pagos registrados</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Su historial completo en este torneo</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    disabled={deletingPlayer}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePlayer(showDeleteConfirm.player!.id)}
                    disabled={deletingPlayer}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {deletingPlayer ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Eliminando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Eliminar Definitivamente</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 