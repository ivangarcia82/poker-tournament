'use client'

import { useState, useEffect, useRef } from 'react'
import { Tournament } from '@/types'
import PlayerList from './PlayerList'
import BlindStructure from './BlindStructure'
import TournamentStats from './TournamentStats'
import TournamentClock from '../tournament/TournamentClock'
import LoadingOverlay from '../ui/LoadingOverlay'
import ConfigurePrizesModal from './ConfigurePrizesModal'
import Toast from '../ui/Toast'
import TournamentSnapshots from './TournamentSnapshots'
import AdvancedPaymentsPanel from './AdvancedPaymentsPanel'
import FinancialStats from './FinancialStats'
import PaymentNotifications from './PaymentNotifications'
import TournamentHistory from './TournamentHistory'
import DeleteTournamentModal from './DeleteTournamentModal'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import ReactDOM from 'react-dom'

// Extender el tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: { finalY: number }
  }
}
import TournamentReports from './TournamentReports'
import PrizeAssignmentModal from './PrizeAssignmentModal'

interface TournamentDetailProps {
  tournament: Tournament
  user: import('@/types').User
  onBack: () => void
  onUpdate: () => void
}

// Reemplazar TournamentActionsMenu por un menú de tres puntos verticales compacto
function TournamentActionsMenu({ onExportPDF, onExportCSV, onDelete, canDelete }: { onExportPDF: () => void, onExportCSV: () => void, onDelete: () => void, canDelete: boolean }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      // Calcular posición del menú respecto al botón
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setMenuStyle({
          position: 'absolute',
          top: rect.bottom + 8 + window.scrollY,
          left: rect.right - 256 + window.scrollX, // 256px = ancho del menú
          zIndex: 9999,
        })
      }
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-gray-100 border border-gray-200 shadow transition-all duration-200 focus:outline-none"
        aria-label="Más acciones"
      >
        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {open && typeof window !== 'undefined' && ReactDOM.createPortal(
        <div ref={menuRef} style={menuStyle} className="w-64 bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl divide-y divide-gray-100">
          <button
            onClick={() => { setOpen(false); onExportPDF(); }}
            className="w-full flex items-center gap-3 px-5 py-3 text-gray-800 hover:bg-blue-50 transition-all text-sm"
          >
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar a PDF
          </button>
          <button
            onClick={() => { setOpen(false); onExportCSV(); }}
            className="w-full flex items-center gap-3 px-5 py-3 text-gray-800 hover:bg-green-50 transition-all text-sm"
          >
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar a CSV
          </button>
          {canDelete && (
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              className="w-full flex items-center gap-3 px-5 py-3 text-red-600 hover:bg-red-50 transition-all text-sm"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar Torneo
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  )
}

function exportTournamentToCSV(tournament: Tournament) {
  // Encabezados
  const headers = [
    'Nombre',
    'Email',
    'Pagos',
    'Recompras',
    'Add-ons',
    'Bonos',
    'Balance',
    'Posición',
    'Premio'
  ]
  // Filas de jugadores
  const rows = tournament.players.map((player) => {
    const pagos = player.playerPayments?.reduce((sum, p) => sum + p.amount, 0) || 0
    const rebuys = player.transactions?.filter(t => t.type === 'REBUY').length || 0
    const addons = player.transactions?.filter(t => t.type === 'ADD_ON').length || 0
    const bonos = player.transactions?.filter(t => t.type === 'OTHER' && t.description && t.description.startsWith('Bono:')).length || 0
    const balance = pagos - (rebuys * (tournament.rebuy || 0) + addons * (tournament.addOn || 0))
    const premio = tournament.prizes?.find(p => p.position === player.position)?.amount || ''
    return [
      player.user?.name || player.name || '',
      player.user?.email || '',
      pagos,
      rebuys,
      addons,
      bonos,
      balance,
      player.position || '',
      premio
    ]
  })
  // Resumen financiero
  const resumen = [
    [],
    ['Resumen financiero'],
    ['Total buy-in', tournament.buyIn * tournament.players.length],
    ['Total add-ons', (tournament.addOn || 0) * tournament.players.length],
    ['Total rebuys', (tournament.rebuy || 0) * tournament.players.length],
    ['Total premios', tournament.prizes?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0],
    ['Rake', tournament.rake + '%']
  ]
  // Unir todo
  const csv = [
    headers.join(','),
    ...rows.map(r => r.join(',')),
    '',
    ...resumen.map(r => r.join(','))
  ].join('\n')
  // Nombre del archivo
  const fecha = new Date(tournament.startTime).toISOString().slice(0,10)
  const nombre = `Torneo_${tournament.name.replace(/\s+/g,'_')}_${fecha}.csv`
  // Descargar
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, nombre)
}

function exportTournamentToPDF(tournament: Tournament) {
  const doc = new jsPDF()
  const fecha = new Date(tournament.startTime).toLocaleDateString('es-MX')
  // Título
  doc.setFontSize(18)
  doc.text(tournament.name, 14, 18)
  doc.setFontSize(12)
  doc.text(`Organizador: ${tournament.organizer.name}`, 14, 26)
  doc.text(`Fecha: ${fecha}`, 14, 34)
  // Tabla de posiciones
  const tableBody = tournament.players.map((player, idx) => [
    idx + 1,
    player.user?.name || player.name || '',
    player.user?.email || '',
    player.chips,
    player.playerPayments?.reduce((sum, p) => sum + p.amount, 0) || 0,
    player.transactions?.filter(t => t.type === 'REBUY').length || 0,
    player.transactions?.filter(t => t.type === 'ADD_ON').length || 0,
    player.transactions?.filter(t => t.type === 'OTHER' && t.description && t.description.startsWith('Bono:')).length || 0,
    (player.playerPayments?.reduce((sum, p) => sum + p.amount, 0) || 0) - ((player.transactions?.filter(t => t.type === 'REBUY').length || 0) * (tournament.rebuy || 0) + (player.transactions?.filter(t => t.type === 'ADD_ON').length || 0) * (tournament.addOn || 0)),
    player.position || '',
    tournament.prizes?.find(p => p.position === player.position)?.amount || ''
  ])
  doc.autoTable({
    head: [[
      '#', 'Nombre', 'Email', 'Fichas', 'Pagos', 'Recompras', 'Add-ons', 'Bonos', 'Balance', 'Posición', 'Premio'
    ]],
    body: tableBody,
    startY: 40,
    styles: { fontSize: 9 }
  })
  // Resumen financiero
  let y = doc.lastAutoTable.finalY + 10
  doc.setFontSize(12)
  doc.text('Resumen financiero', 14, y)
  y += 6
  doc.setFontSize(10)
  doc.text(`Total buy-in: $${tournament.buyIn * tournament.players.length}`, 14, y)
  y += 6
  doc.text(`Total add-ons: $${(tournament.addOn || 0) * tournament.players.length}`, 14, y)
  y += 6
  doc.text(`Total rebuys: $${(tournament.rebuy || 0) * tournament.players.length}`, 14, y)
  y += 6
  doc.text(`Total premios: $${tournament.prizes?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0}`, 14, y)
  y += 6
  doc.text(`Rake: ${tournament.rake}%`, 14, y)
  // Descargar
  const nombre = `Torneo_${tournament.name.replace(/\s+/g,'_')}_${fecha}.pdf`
  doc.save(nombre)
}

export default function TournamentDetail({ tournament, user, onBack, onUpdate }: TournamentDetailProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [showPrizesModal, setShowPrizesModal] = useState(false)
  const [prizes, setPrizes] = useState(tournament.prizes.map(p => ({ position: p.position, percentage: p.percentage })))
  const [prizesFeedback, setPrizesFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'warning' | 'info' } | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeletingTournament, setIsDeletingTournament] = useState(false)
  const [showPrizeAssignmentModal, setShowPrizeAssignmentModal] = useState(false)
  const [isAssigningPrizes, setIsAssigningPrizes] = useState(false)



  // Log para debug
  console.log('🎯 TournamentDetail - Estado del torneo:', tournament.status)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTERING':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      case 'STARTING':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
      case 'RUNNING':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
      case 'PAUSED':
        return 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
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
      case 'PAUSED':
        return 'Pausado'
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

  const tabs = [
    { id: 'overview', name: 'Resumen', icon: '📊' },
    { id: 'players', name: 'Jugadores', icon: '👥' },
    { id: 'blinds', name: 'Estructura de Blinds', icon: '🃏' },
    { id: 'prizes', name: 'Premios', icon: '🏆' },
    { id: 'audit', name: 'Historial', icon: '📝' },
    { id: 'snapshots', name: 'Snapshots', icon: '📸' },
    { id: 'reports', name: 'Reportes', icon: '📈' },
  ]

  // Calcular el prize pool sumando todas las transacciones relevantes
  const allTransactions = tournament.players.flatMap(p => p.transactions)
  const totalBuyIns = allTransactions.filter(t => t.type === 'BUY_IN').reduce((sum, t) => sum + t.amount, 0)
  const totalAddOns = allTransactions.filter(t => t.type === 'ADD_ON').reduce((sum, t) => sum + t.amount, 0)
  const totalRebuys = allTransactions.filter(t => t.type === 'REBUY').reduce((sum, t) => sum + t.amount, 0)
  const totalBonos = allTransactions.filter(t => t.type === 'OTHER' && t.description && t.description.startsWith('Bono:')).reduce((sum, t) => sum + t.amount, 0)
  const totalRake = (totalBuyIns + totalAddOns + totalRebuys + totalBonos) * (tournament.rake / 100)
  const prizePool = totalBuyIns + totalAddOns + totalRebuys + totalBonos - totalRake

  const handleSavePrizes = async (newPrizes: { position: number; percentage: number }[]) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/prizes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizes: newPrizes })
      })
      if (response.ok) {
        setPrizes(newPrizes)
        onUpdate()
        setShowPrizesModal(false)
        setPrizesFeedback({ type: 'success', message: 'Premios guardados correctamente.' })
        setToast({ message: 'Premios guardados correctamente', type: 'success' })
      } else {
        const error = await response.json()
        setPrizesFeedback({ type: 'error', message: error.error || 'Error al guardar premios' })
        setToast({ message: error.error || 'Error al guardar premios', type: 'error' })
      }
    } catch (error) {
      setPrizesFeedback({ type: 'error', message: 'Error de conexión' })
      setToast({ message: 'Error de conexión', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (prizesFeedback) {
      const timeout = setTimeout(() => setPrizesFeedback(null), 3000)
      return () => clearTimeout(timeout)
    }
  }, [prizesFeedback])



  // Cambios de estado del torneo (iniciar, pausar, reanudar, finalizar)
  const handleChangeStatus = async (status: string, extraData: any = {}) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extraData })
      })
      if (response.ok) {
        onUpdate()
        let msg = ''
        switch (status) {
          case 'RUNNING': msg = 'Torneo iniciado'; break
          case 'PAUSED': msg = 'Torneo pausado'; break
          case 'FINISHED': msg = 'Torneo finalizado'; break
          default: msg = 'Estado actualizado';
        }
        setToast({ message: msg, type: 'success' })
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Error al actualizar estado', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Error de conexión', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTournament = async () => {
    setIsDeletingTournament(true)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tournamentName: tournament.name
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setToast({ message: data.message || 'Torneo eliminado exitosamente', type: 'success' })
        setTimeout(() => {
          onBack()
        }, 1500)
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Error al eliminar torneo', type: 'error' })
      }
    } catch (error) {
      console.error('Error eliminando torneo:', error)
      setToast({ message: 'Error de conexión', type: 'error' })
    } finally {
      setIsDeletingTournament(false)
    }
  }

  const handleAssignPrizes = async (assignments: { playerId: string; position: number; amount: number }[]) => {
    setIsAssigningPrizes(true)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/assign-prizes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments })
      })

      if (response.ok) {
        const data = await response.json()
        setToast({ 
          message: `Premios asignados exitosamente a ${data.assignments} jugadores`, 
          type: 'success' 
        })
        setShowPrizeAssignmentModal(false)
        onUpdate() // Actualizar el torneo
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Error al asignar premios', type: 'error' })
      }
    } catch (error) {
      console.error('Error asignando premios:', error)
      setToast({ message: 'Error de conexión', type: 'error' })
    } finally {
      setIsAssigningPrizes(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <LoadingOverlay isLoading={isLoading} text="Procesando..." />
      {/* Header */}
      <header className="relative overflow-hidden bg-white/80 backdrop-blur-xl shadow-xl border-b border-white/20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="inline-flex items-center space-x-2 mr-6 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Volver</span>
              </button>
              <div className="flex items-center space-x-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {tournament.name}
                  </h1>
                  <p className="text-gray-600 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Organizado por {tournament.organizer.name}</span>
                  </p>
                </div>
              </div>
              <TournamentActionsMenu
                onExportPDF={() => exportTournamentToPDF(tournament)}
                onExportCSV={() => exportTournamentToCSV(tournament)}
                onDelete={handleDeleteTournament}
                canDelete={tournament.organizerId === user.id}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${getStatusColor(tournament.status)}`}>
                {getStatusText(tournament.status)}
              </span>
              {/* Botón de acción principal */}
              {tournament.status === 'REGISTERING' && (
                <button
                  onClick={() => handleChangeStatus('RUNNING', { startTime: new Date().toISOString() })}
                  disabled={isLoading}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{isLoading ? 'Iniciando...' : 'Iniciar Torneo'}</span>
                </button>
              )}
              {tournament.status === 'RUNNING' && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleChangeStatus('PAUSED')}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Pausar</span>
                  </button>
                  <button
                    onClick={() => handleChangeStatus('FINISHED')}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Finalizar</span>
                  </button>
                </div>
              )}
              {tournament.status === 'PAUSED' && (
                <button
                  onClick={() => handleChangeStatus('RUNNING', { startTime: new Date().toISOString() })}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Reanudar</span>
                </button>
              )}
              {/* Botón para abrir reloj en nueva pestaña */}
              {(tournament.status === 'RUNNING' || tournament.status === 'PAUSED') && (
                <button
                  onClick={() => {
                    setIsLoading(true)
                    window.open(`/tournament/${tournament.id}/clock`, '_blank')
                    setTimeout(() => setIsLoading(false), 1000)
                  }}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Pantalla Reloj</span>
                </button>
              )}
              {/* Botón para asignar premios - solo para organizador */}
              {tournament.organizerId === user.id && (
                <button
                  onClick={() => setShowPrizeAssignmentModal(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Asignar Premios</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="relative bg-white/80 backdrop-blur-xl border-b border-white/20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-purple-50/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'players' | 'blinds' | 'prizes' | 'audit' | 'snapshots' | 'reports')}
                className={`relative px-6 py-4 font-medium text-sm rounded-t-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.name}</span>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'overview' && (
            <div className="relative">
              {isLoading && <LoadingOverlay isLoading={true} text="Actualizando resumen..." />}
              <div className="space-y-8">
                {/* Información básica */}
                <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
                  <div className="relative p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Información del Torneo
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Buy-in</dt>
                          <dd className="text-lg font-semibold text-gray-900">${tournament.buyIn}</dd>
                        </div>
                      </div>
                      {tournament.addOn && (
                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Add-on</dt>
                            <dd className="text-lg font-semibold text-gray-900">${tournament.addOn}</dd>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stack Inicial</dt>
                          <dd className="text-lg font-semibold text-gray-900">{tournament.initialStack.toLocaleString()} fichas</dd>
                        </div>
                      </div>
                      {tournament.rebuy && (
                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recompra</dt>
                            <dd className="text-lg font-semibold text-gray-900">
                              ${tournament.rebuy}
                              {tournament.rebuyChips && ` (${tournament.rebuyChips.toLocaleString()} fichas)`}
                              {tournament.doubleRebuy && ' (Doble permitida)'}
                              {tournament.doubleRebuy && tournament.doubleRebuyPrice && ` - Doble: $${tournament.doubleRebuyPrice}`}
                              {tournament.doubleRebuy && tournament.doubleRebuyChips && ` (${tournament.doubleRebuyChips.toLocaleString()} fichas)`}
                            </dd>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rake</dt>
                          <dd className="text-lg font-semibold text-gray-900">{tournament.rake}%</dd>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Jugadores</dt>
                          <dd className="text-lg font-semibold text-gray-900">
                            {tournament.players.length}/{tournament.maxPlayers}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl border border-teal-200">
                        <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Inicio</dt>
                          <dd className="text-lg font-semibold text-gray-900">
                            {formatDate(tournament.startTime)}
                          </dd>
                        </div>
                      </div>
                      {tournament.endTime && (
                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl border border-pink-200">
                          <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fin</dt>
                            <dd className="text-lg font-semibold text-gray-900">
                              {formatDate(tournament.endTime)}
                            </dd>
                          </div>
                        </div>
                      )}
                    </div>
                    {tournament.description && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Descripción</dt>
                        <dd className="text-sm text-gray-900">{tournament.description}</dd>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controles del Torneo */}
                <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
                  <div className="relative p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.894-1.447L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Controles del Torneo
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {tournament.status === 'REGISTERING' ? (
                        <button
                          onClick={() => handleChangeStatus('RUNNING', { startTime: new Date().toISOString() })}
                          disabled={isLoading}
                          className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{isLoading ? 'Iniciando...' : 'Iniciar Torneo'}</span>
                        </button>
                      ) : tournament.status === 'RUNNING' ? (
                        <>
                          <button
                            onClick={() => handleChangeStatus('PAUSED')}
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Pausar Torneo</span>
                          </button>
                          <button
                            onClick={() => handleChangeStatus('FINISHED')}
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-medium">Finalizar Torneo</span>
                          </button>
                          {/* Botón de Reiniciar Torneo - Solo para organizador */}
                          {tournament.organizerId === user.id && (
                            <button
                              onClick={() => {
                                if (window.confirm('¿Estás seguro de que quieres reiniciar el torneo? Esto volverá al nivel 1 y reiniciará el tiempo.')) {
                                  handleChangeStatus('RUNNING', { 
                                    startTime: new Date().toISOString(),
                                    currentLevel: 0,
                                    timeRemaining: tournament.blindStructure[0]?.duration * 60 || 0
                                  })
                                }
                              }}
                              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span className="font-medium">Reiniciar Torneo</span>
                            </button>
                          )}
                        </>
                      ) : tournament.status === 'PAUSED' ? (
                        <>
                          <button
                            onClick={() => handleChangeStatus('RUNNING', { startTime: new Date().toISOString() })}
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Reanudar Torneo</span>
                          </button>
                          {/* Botón de Reiniciar Torneo - Solo para organizador */}
                          {tournament.organizerId === user.id && (
                            <button
                              onClick={() => {
                                if (window.confirm('¿Estás seguro de que quieres reiniciar el torneo? Esto volverá al nivel 1 y reiniciará el tiempo.')) {
                                  handleChangeStatus('RUNNING', { 
                                    startTime: new Date().toISOString(),
                                    currentLevel: 0,
                                    timeRemaining: tournament.blindStructure[0]?.duration * 60 || 0
                                  })
                                }
                              }}
                              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span className="font-medium">Reiniciar Torneo</span>
                            </button>
                          )}
                        </>
                      ) : tournament.status === 'FINISHED' ? (
                        <div className="flex flex-wrap gap-4 items-center">
                          <div className="text-gray-500 flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Torneo finalizado</span>
                          </div>
                          {/* Botón para asignar premios - Solo para organizador */}
                          {tournament.organizerId === user.id && (
                            <button
                              onClick={() => setShowPrizeAssignmentModal(true)}
                              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">Asignar Premios</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500 flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Torneo cancelado</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Estadísticas */}
                <TournamentStats tournament={tournament} />
                <FinancialStats tournament={tournament} />
                <PaymentNotifications tournament={tournament} />
              </div>
            </div>
          )}

          {activeTab === 'players' && (
            <PlayerList tournament={tournament} user={user} onUpdate={onUpdate} />
          )}

          {activeTab === 'blinds' && (
            <BlindStructure
              blindStructure={tournament.blindStructure}
              tournament={tournament}
              user={user}
            />
          )}

          {activeTab === 'prizes' && (
            <div className="relative space-y-6">
              {isLoading && <LoadingOverlay isLoading={true} text="Actualizando premios..." />}
              {prizesFeedback && (
                <div className={`fixed bottom-6 right-6 z-[1200] px-4 py-2 rounded text-sm font-medium shadow-lg ${prizesFeedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {prizesFeedback.message}
                </div>
              )}
              <button
                onClick={() => setShowPrizesModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium mb-4"
              >
                Configurar premios
              </button>
              
              <table className="min-w-full divide-y divide-gray-200 bg-white shadow rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posición</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Porcentaje</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prizes.map((prize, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap">#{prize.position}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{prize.percentage}%</td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold">${((prize.percentage * prizePool) / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mostrar premios asignados si el torneo está finalizado */}
              {tournament.status === 'FINISHED' && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    🏆 Premios Asignados
                  </h3>
                  {tournament.players.filter(p => p.position).length > 0 ? (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
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
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {tournament.players
                            .filter(p => p.position)
                            .sort((a, b) => (a.position || 0) - (b.position || 0))
                            .map((player) => {
                              const prize = tournament.prizes.find(p => p.position === player.position)
                              const prizeAmount = prize ? (prizePool * prize.percentage) / 100 : 0
                              return (
                                <tr key={player.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      {player.position}°
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                    {player.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">
                                    ${prizeAmount.toFixed(2)}
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">
                        No se han asignado premios aún
                      </p>
                      {tournament.organizerId === user.id && (
                        <button
                          onClick={() => setShowPrizeAssignmentModal(true)}
                          className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium"
                        >
                          🏆 Asignar Premios
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {showPrizesModal && (
                <ConfigurePrizesModal
                  prizePool={prizePool}
                  initialPrizes={prizes}
                  onClose={() => setShowPrizesModal(false)}
                  onSave={handleSavePrizes}
                />
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <TournamentHistory tournament={tournament} user={user} />
          )}

          {activeTab === 'snapshots' && (
            <TournamentSnapshots tournament={tournament} onUpdate={onUpdate} />
          )}

          {activeTab === 'reports' && (
            <div className="reports-section">
              <TournamentReports tournament={tournament} />
            </div>
          )}

          {activeTab === 'payments' && (
            <AdvancedPaymentsPanel tournament={tournament} onUpdate={onUpdate} />
          )}
        </div>
      </main>

      {/* Modal de eliminación de torneo */}
      {showDeleteModal && (
        <DeleteTournamentModal
          tournament={tournament}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteTournament}
          isDeleting={isDeletingTournament}
        />
      )}

      {/* Modal de asignación de premios */}
      {showPrizeAssignmentModal && (
        <PrizeAssignmentModal
          tournament={tournament}
          onClose={() => setShowPrizeAssignmentModal(false)}
          onAssign={handleAssignPrizes}
          isAssigning={isAssigningPrizes}
        />
      )}
    </div>
  )
} 