import { useState, useEffect } from 'react'
import { Tournament } from '@/types'
import Toast from '../ui/Toast'

interface PaymentNotificationsProps {
  tournament: Tournament
}

interface PendingPayment {
  playerId: string
  playerName: string
  amount: number
  daysOverdue: number
  lastReminder?: string
}

export default function PaymentNotifications({ tournament }: PaymentNotificationsProps) {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    calculatePendingPayments()
  }, [tournament])

  const calculatePendingPayments = () => {
    const pending = tournament.players
      .filter(player => (player as any).deuda > (player as any).pagado)
      .map(player => {
        const remainingDebt = (player as any).deuda - (player as any).pagado
        const daysOverdue = Math.floor((Date.now() - new Date(player.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          playerId: player.id,
          playerName: player.name,
          amount: remainingDebt,
          daysOverdue,
          lastReminder: undefined // TODO: Implementar sistema de recordatorios
        }
      })
      .sort((a, b) => b.amount - a.amount) // Ordenar por monto pendiente

    setPendingPayments(pending)
  }

  const sendReminder = async (playerId: string) => {
    try {
      // TODO: Implementar envío de recordatorio por WhatsApp/Telegram
      setToast({ message: 'Recordatorio enviado exitosamente', type: 'success' })
    } catch (error) {
      setToast({ message: 'Error enviando recordatorio', type: 'error' })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getPriorityColor = (amount: number, daysOverdue: number) => {
    if (amount > 100 || daysOverdue > 7) return 'text-red-600 bg-red-50'
    if (amount > 50 || daysOverdue > 3) return 'text-orange-600 bg-orange-50'
    return 'text-yellow-600 bg-yellow-50'
  }

  const getPriorityIcon = (amount: number, daysOverdue: number) => {
    if (amount > 100 || daysOverdue > 7) return '🔴'
    if (amount > 50 || daysOverdue > 3) return '🟠'
    return '🟡'
  }

  if (pendingPayments.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🔔</span>
          <h3 className="text-lg font-semibold text-gray-900">Cobros Pendientes</h3>
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
            {pendingPayments.length}
          </span>
        </div>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showNotifications ? 'Ocultar' : 'Ver detalles'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(pendingPayments.reduce((sum, p) => sum + p.amount, 0))}
          </div>
          <div className="text-sm text-red-700">Total Pendiente</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {pendingPayments.filter(p => p.amount > 50).length}
          </div>
          <div className="text-sm text-orange-700">Deudas Altas</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {pendingPayments.filter(p => p.daysOverdue > 3).length}
          </div>
          <div className="text-sm text-yellow-700">Vencidas</div>
        </div>
      </div>

      {/* Detailed List */}
      {showNotifications && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 mb-3">📋 Lista de Cobros Pendientes</h4>
          {pendingPayments.map((payment) => (
            <div
              key={payment.playerId}
              className={`p-4 rounded-lg border ${getPriorityColor(payment.amount, payment.daysOverdue)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getPriorityIcon(payment.amount, payment.daysOverdue)}</span>
                    <h5 className="font-medium text-gray-900">{payment.playerName}</h5>
                    <span className="text-sm text-gray-500">
                      {payment.daysOverdue > 0 ? `${payment.daysOverdue} días` : 'Hoy'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Pendiente: {formatCurrency(payment.amount)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => sendReminder(payment.playerId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                  >
                    📱 Recordar
                  </button>
                  <button
                    onClick={() => {/* TODO: Abrir modal de pago */}}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
                  >
                    💳 Cobrar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <button
            onClick={() => {
              // TODO: Enviar recordatorios masivos
              setToast({ message: 'Recordatorios masivos enviados', type: 'success' })
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
          >
            📱 Enviar Recordatorios
          </button>
          <button
            onClick={() => {
              // TODO: Generar reporte de cobros pendientes
              setToast({ message: 'Reporte generado exitosamente', type: 'success' })
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
          >
            📊 Generar Reporte
          </button>
        </div>
      </div>
    </div>
  )
} 