import { Tournament } from '@/types'
import { Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

interface TournamentReportsProps {
  tournament: Tournament
}

export default function TournamentReports({ tournament }: TournamentReportsProps) {
  // Sumar transacciones reales
  const allTransactions = tournament.players.flatMap(p => p.transactions)
  const totalBuyIn = allTransactions.filter(t => t.type === 'BUY_IN').reduce((sum, t) => sum + t.amount, 0)
  const totalAddOns = allTransactions.filter(t => t.type === 'ADD_ON').reduce((sum, t) => sum + t.amount, 0)
  const totalRebuys = allTransactions.filter(t => t.type === 'REBUY').reduce((sum, t) => sum + t.amount, 0)
  const totalBonos = allTransactions.filter(t => t.type === 'OTHER' && t.description && t.description.startsWith('Bono:')).reduce((sum, t) => sum + t.amount, 0)
  const totalPagado = tournament.players.reduce((sum, p) => sum + (p.playerPayments?.reduce((s, pay) => s + pay.amount, 0) || 0), 0)
  const totalPremios = tournament.prizes?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
  const totalRake = (totalBuyIn + totalAddOns + totalRebuys + totalBonos) * (tournament.rake / 100)
  const totalPendiente = totalBuyIn + totalAddOns + totalRebuys + totalBonos - totalPagado
  const porcentajeCobro = (totalBuyIn + totalAddOns + totalRebuys + totalBonos) > 0 ? (totalPagado / (totalBuyIn + totalAddOns + totalRebuys + totalBonos)) * 100 : 0

  // Datos para gráficas
  const jugadores = tournament.players.map(p => p.user?.name || p.name || 'Sin nombre')
  const pagosPorJugador = tournament.players.map(p => p.playerPayments?.reduce((s, pay) => s + pay.amount, 0) || 0)
  const recomprasPorJugador = tournament.players.map(p => p.transactions?.filter(t => t.type === 'REBUY').length || 0)

  const pieData = {
    labels: ['Pagado', 'Pendiente'],
    datasets: [
      {
        data: [totalPagado, totalPendiente],
        backgroundColor: ['#22c55e', '#f87171']
      }
    ]
  }

  const barData = {
    labels: jugadores,
    datasets: [
      {
        label: 'Pagos por jugador',
        data: pagosPorJugador,
        backgroundColor: '#3b82f6'
      },
      {
        label: 'Recompras por jugador',
        data: recomprasPorJugador,
        backgroundColor: '#f59e42'
      }
    ]
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-4">📈 Reportes y Estadísticas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-2">
          <h3 className="text-lg font-semibold mb-2">Indicadores financieros</h3>
          <div>Total recaudado: <span className="font-bold text-green-700">${totalPagado.toLocaleString()}</span></div>
          <div>Total pendiente: <span className="font-bold text-red-700">${totalPendiente.toLocaleString()}</span></div>
          <div>Porcentaje de cobro: <span className="font-bold">{porcentajeCobro.toFixed(1)}%</span></div>
          <div>Rake: <span className="font-bold">${totalRake.toLocaleString()}</span></div>
          <div>Total premios: <span className="font-bold">${totalPremios.toLocaleString()}</span></div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Pagado vs Pendiente</h3>
          <Pie data={pieData} />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">Pagos y recompras por jugador</h3>
        <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: 'top' as const } } }} />
      </div>
    </div>
  )
} 