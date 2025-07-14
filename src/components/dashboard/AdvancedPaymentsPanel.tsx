import { useState, useEffect } from 'react'
import { Tournament } from '@/types'
import Toast from '../ui/Toast'

interface AdvancedPaymentsPanelProps {
  tournament: Tournament
  onUpdate: () => void
}

interface PaymentHistory {
  id: string
  playerId: string
  playerName: string
  amount: number
  method: string
  description: string
  createdAt: string
}

interface PlayerDebtSummary {
  playerId: string
  playerName: string
  totalDebt: number
  totalPaid: number
  remainingDebt: number
  lastPaymentDate?: string
  paymentCount: number
}

export default function AdvancedPaymentsPanel({ tournament, onUpdate }: AdvancedPaymentsPanelProps) {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [debtSummary, setDebtSummary] = useState<PlayerDebtSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'summary' | 'history' | 'reports'>('summary')
  const [filterPlayer, setFilterPlayer] = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    loadPaymentData()
  }, [tournament.id])

  const loadPaymentData = async () => {
    setLoading(true)
    try {
      // Cargar historial de pagos
      const historyResponse = await fetch(`/api/tournaments/${tournament.id}/payments/history`)
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setPaymentHistory(historyData)
      }

      // Cargar resumen de deudas
      const summaryResponse = await fetch(`/api/tournaments/${tournament.id}/payments/summary`)
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setDebtSummary(summaryData)
      }
    } catch (error) {
      console.error('Error cargando datos de pagos:', error)
      setToast({ message: 'Error cargando datos', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = paymentHistory.filter(payment => {
    const matchesPlayer = !filterPlayer || payment.playerName.toLowerCase().includes(filterPlayer.toLowerCase())
    const matchesMethod = !filterMethod || payment.method === filterMethod
    const matchesDate = !dateRange.start || !dateRange.end || 
      (new Date(payment.createdAt) >= new Date(dateRange.start) && 
       new Date(payment.createdAt) <= new Date(dateRange.end))
    
    return matchesPlayer && matchesMethod && matchesDate
  })

  const totalCollected = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)
  const totalDebt = debtSummary.reduce((sum, player) => sum + player.totalDebt, 0)
  const remainingDebt = totalDebt - totalCollected
  const collectionRate = totalDebt > 0 ? (totalCollected / totalDebt) * 100 : 0

  const exportToCSV = () => {
    const headers = ['Jugador', 'Deuda Total', 'Pagado', 'Pendiente', 'Último Pago', 'Cantidad de Pagos']
    const csvContent = [
      headers.join(','),
      ...debtSummary.map(player => [
        player.playerName,
        player.totalDebt,
        player.totalPaid,
        player.remainingDebt,
        player.lastPaymentDate || 'N/A',
        player.paymentCount
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pagos-torneo-${tournament.name}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    setToast({ message: 'Reporte exportado exitosamente', type: 'success' })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">💰 Panel de Cobros Avanzado</h2>
        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
        >
          📊 Exportar CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Resumen de Deudas
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Historial de Pagos
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reportes
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900">Deuda Total</h3>
              <p className="text-3xl font-bold text-blue-700">{formatCurrency(totalDebt)}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900">Cobrado</h3>
              <p className="text-3xl font-bold text-green-700">{formatCurrency(totalCollected)}</p>
            </div>
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-red-900">Pendiente</h3>
              <p className="text-3xl font-bold text-red-700">{formatCurrency(remainingDebt)}</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900">Tasa de Cobro</h3>
              <p className="text-3xl font-bold text-purple-700">{collectionRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Debt Summary Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jugador</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deuda Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pendiente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {debtSummary.map((player) => (
                  <tr key={player.playerId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {player.playerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(player.totalDebt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(player.totalPaid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {formatCurrency(player.remainingDebt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.lastPaymentDate ? formatDate(player.lastPaymentDate) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.paymentCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        player.remainingDebt === 0 
                          ? 'bg-green-100 text-green-800' 
                          : player.remainingDebt < player.totalDebt * 0.5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {player.remainingDebt === 0 ? 'Pagado' : 
                         player.remainingDebt < player.totalDebt * 0.5 ? 'Parcial' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <input
              type="text"
              placeholder="Filtrar por jugador..."
              value={filterPlayer}
              onChange={(e) => setFilterPlayer(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los métodos</option>
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="OTHER">Otro</option>
            </select>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payment History Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jugador</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.playerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.method}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {payment.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No se encontraron pagos con los filtros aplicados</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Resumen Financiero</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Estadísticas Generales</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Total de jugadores con deuda: {debtSummary.filter(p => p.totalDebt > 0).length}</li>
                  <li>• Jugadores completamente pagados: {debtSummary.filter(p => p.remainingDebt === 0).length}</li>
                  <li>• Total de transacciones: {paymentHistory.length}</li>
                  <li>• Promedio por pago: {paymentHistory.length > 0 ? formatCurrency(totalCollected / paymentHistory.length) : '$0'}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Métodos de Pago</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  {Object.entries(
                    paymentHistory.reduce((acc, payment) => {
                      acc[payment.method] = (acc[payment.method] || 0) + payment.amount
                      return acc
                    }, {} as Record<string, number>)
                  ).map(([method, amount]) => (
                    <li key={method}>• {method}: {formatCurrency(amount)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">📤 Opciones de Exportación</h3>
            <div className="flex space-x-4">
              <button
                onClick={exportToCSV}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
              >
                📊 Exportar CSV
              </button>
              <button
                onClick={() => setToast({ message: 'Función de PDF en desarrollo', type: 'info' })}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
              >
                📄 Exportar PDF
              </button>
              <button
                onClick={() => setToast({ message: 'Función de Excel en desarrollo', type: 'info' })}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
              >
                📈 Exportar Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 