import { useState, useEffect } from 'react'
import { Tournament } from '@/types'

interface FinancialStatsProps {
  tournament: Tournament
}

interface FinancialData {
  totalBuyIns: number
  totalAddOns: number
  totalRebuys: number
  totalBonuses: number
  totalRake: number
  prizePool: number
  totalCollected: number
  remainingDebt: number
  collectionRate: number
}

export default function FinancialStats({ tournament }: FinancialStatsProps) {
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalBuyIns: 0,
    totalAddOns: 0,
    totalRebuys: 0,
    totalBonuses: 0,
    totalRake: 0,
    prizePool: 0,
    totalCollected: 0,
    remainingDebt: 0,
    collectionRate: 0
  })

  useEffect(() => {
    calculateFinancialData()
  }, [tournament])

  const calculateFinancialData = () => {
    // Obtener todas las transacciones de todos los jugadores
    const allTransactions = tournament.players.flatMap(player => player.transactions || [])
    
    // Calcular totales desde las transacciones reales
    const totalBuyIns = allTransactions
      .filter(tx => tx.type === 'BUY_IN')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0)
    
    const totalAddOns = allTransactions
      .filter(tx => tx.type === 'ADD_ON')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0)
    
    const totalRebuys = allTransactions
      .filter(tx => tx.type === 'REBUY')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0)
    
    const totalBonuses = allTransactions
      .filter(tx => tx.type === 'OTHER' && tx.description && tx.description.startsWith('Bono:'))
      .reduce((sum, tx) => sum + (tx.amount || 0), 0)

    const totalRevenue = totalBuyIns + totalAddOns + totalRebuys + totalBonuses
    const totalRake = totalRevenue * ((tournament.rake || 0) / 100)
    const prizePool = totalRevenue - totalRake

    // Calcular cobros desde los pagos reales
    const totalCollected = tournament.players.reduce((sum, player) => {
      const playerPayments = player.playerPayments || []
      return sum + playerPayments.reduce((paymentSum, payment) => paymentSum + (payment.amount || 0), 0)
    }, 0)
    
    // Calcular deuda total
    const totalDebt = totalRevenue // La deuda total es igual al revenue total
    const remainingDebt = Math.max(0, totalDebt - totalCollected)
    const collectionRate = totalDebt > 0 ? (totalCollected / totalDebt) * 100 : 0

    setFinancialData({
      totalBuyIns,
      totalAddOns,
      totalRebuys,
      totalBonuses,
      totalRake,
      prizePool,
      totalCollected,
      remainingDebt,
      collectionRate
    })
  }

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || !isFinite(amount)) {
      return '$0.00'
    }
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">💰 Estadísticas Financieras</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Ingresos */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">📈 Ingresos</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Buy-ins:</span>
              <span className="text-sm font-medium">{formatCurrency(financialData.totalBuyIns)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Add-ons:</span>
              <span className="text-sm font-medium">{formatCurrency(financialData.totalAddOns)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Recompras:</span>
              <span className="text-sm font-medium">{formatCurrency(financialData.totalRebuys)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Bonos:</span>
              <span className="text-sm font-medium">{formatCurrency(financialData.totalBonuses)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-700">Total Ingresos:</span>
                <span className="text-green-600">
                  {formatCurrency(financialData.totalBuyIns + financialData.totalAddOns + financialData.totalRebuys + financialData.totalBonuses)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Distribución */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">📊 Distribución</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Rake ({tournament.rake || 0}%):</span>
              <span className="text-sm font-medium text-red-600">{formatCurrency(financialData.totalRake)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Prize Pool:</span>
              <span className="text-sm font-medium text-blue-600">{formatCurrency(financialData.prizePool)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-700">Total:</span>
                <span className="text-gray-900">
                  {formatCurrency(financialData.totalRake + financialData.prizePool)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cobros */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">💳 Cobros</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cobrado:</span>
              <span className="text-sm font-medium text-green-600">{formatCurrency(financialData.totalCollected)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pendiente:</span>
              <span className="text-sm font-medium text-red-600">{formatCurrency(financialData.remainingDebt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tasa de Cobro:</span>
              <span className="text-sm font-medium text-purple-600">{financialData.collectionRate.toFixed(1)}%</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-700">Deuda Total:</span>
                <span className="text-gray-900">
                  {formatCurrency(financialData.totalCollected + financialData.remainingDebt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar for Collection Rate */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progreso de Cobro</span>
          <span>{financialData.collectionRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(financialData.collectionRate, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{tournament.players.length}</div>
          <div className="text-sm text-blue-700">Jugadores</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(financialData.prizePool)}</div>
          <div className="text-sm text-green-700">Prize Pool</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{financialData.collectionRate.toFixed(1)}%</div>
          <div className="text-sm text-purple-700">Cobrado</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(financialData.totalRake)}</div>
          <div className="text-sm text-orange-700">Rake</div>
        </div>
      </div>
    </div>
  )
} 