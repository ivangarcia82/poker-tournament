'use client'

import { Tournament } from '@/types'
import { calculatePrizePool } from '@/lib/tournament-utils'

interface TournamentStatsProps {
  tournament: Tournament
}

export default function TournamentStats({ tournament }: TournamentStatsProps) {
  const allTransactions = tournament.players.flatMap(p => p.transactions)
  const totalBuyIns = allTransactions.filter(t => t.type === 'BUY_IN').reduce((sum, t) => sum + t.amount, 0)
  const totalAddOns = allTransactions.filter(t => t.type === 'ADD_ON').reduce((sum, t) => sum + t.amount, 0)
  const totalRebuys = allTransactions.filter(t => t.type === 'REBUY').reduce((sum, t) => sum + t.amount, 0)
  const totalBonos = allTransactions.filter(t => t.type === 'OTHER' && t.description && t.description.startsWith('Bono:')).reduce((sum, t) => sum + t.amount, 0)
  const totalRake = (totalBuyIns + totalAddOns + totalRebuys + totalBonos) * (tournament.rake / 100)
  const prizePool = totalBuyIns + totalAddOns + totalRebuys + totalBonos - totalRake
  
  const activePlayers = tournament.players.filter(p => !p.isEliminated)
  const eliminatedPlayers = tournament.players.filter(p => p.isEliminated)
  
  const totalChips = tournament.players.reduce((sum, player) => sum + player.chips, 0)
  const averageChips = activePlayers.length > 0 ? Math.floor(totalChips / activePlayers.length) : 0

  const stats = [
    {
      name: 'Total Buy-ins',
      value: `$${totalBuyIns.toFixed(2)}`,
      description: `${allTransactions.filter(t => t.type === 'BUY_IN').length} buy-ins` ,
      color: 'bg-blue-500'
    },
    {
      name: 'Total Add-ons',
      value: `$${totalAddOns.toFixed(2)}`,
      description: `${allTransactions.filter(t => t.type === 'ADD_ON').length} add-ons` ,
      color: 'bg-green-500'
    },
    {
      name: 'Total Recompras',
      value: `$${totalRebuys.toFixed(2)}`,
      description: `${allTransactions.filter(t => t.type === 'REBUY').length} recompras (sencillas y dobles)` ,
      color: 'bg-orange-500'
    },
    {
      name: 'Total Bonos',
      value: `$${totalBonos.toFixed(2)}`,
      description: `${allTransactions.filter(t => t.type === 'OTHER' && t.description && t.description.startsWith('Bono:')).length} bonos pagados` ,
      color: 'bg-purple-500'
    },
    {
      name: 'Rake',
      value: `$${totalRake.toFixed(2)}`,
      description: `${tournament.rake}% del total`,
      color: 'bg-red-500'
    },
    {
      name: 'Prize Pool',
      value: `$${prizePool.toFixed(2)}`,
      description: 'Total disponible para premios',
      color: 'bg-yellow-500'
    }
  ]

  const playerStats = [
    {
      name: 'Jugadores Registrados',
      value: tournament.players.length,
      description: `de ${tournament.maxPlayers} máximo`,
      color: 'bg-blue-500'
    },
    {
      name: 'Jugadores Activos',
      value: activePlayers.length,
      description: 'en el torneo',
      color: 'bg-green-500'
    },
    {
      name: 'Jugadores Eliminados',
      value: eliminatedPlayers.length,
      description: 'fuera del torneo',
      color: 'bg-red-500'
    },
    {
      name: 'Fichas Promedio',
      value: averageChips.toLocaleString(),
      description: 'por jugador activo',
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Estadísticas financieras */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Estadísticas Financieras
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-2 h-2 ${stat.color} rounded-full`}></div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                      <dd className="text-xs text-gray-500">
                        {stat.description}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Estadísticas de jugadores */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Estadísticas de Jugadores
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {playerStats.map((stat) => (
              <div key={stat.name} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-2 h-2 ${stat.color} rounded-full`}></div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                      <dd className="text-xs text-gray-500">
                        {stat.description}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Distribución de fichas */}
      {activePlayers.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Distribución de Fichas
            </h3>
            <div className="space-y-3">
              {activePlayers
                .sort((a, b) => b.chips - a.chips)
                .map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 w-8">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-gray-900 ml-2">
                        {player.name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {player.chips.toLocaleString()} fichas
                      </span>
                      <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${(player.chips / Math.max(...activePlayers.map(p => p.chips))) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Información Adicional
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Estado del Torneo</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {tournament.status === 'REGISTERING' && 'Registrando jugadores'}
                {tournament.status === 'STARTING' && 'Iniciando torneo'}
                {tournament.status === 'RUNNING' && 'En curso'}
                {tournament.status === 'FINISHED' && 'Finalizado'}
                {tournament.status === 'CANCELLED' && 'Cancelado'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Organizador</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {tournament.organizer.name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha de Inicio</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(tournament.startTime).toLocaleString('es-ES')}
              </dd>
            </div>
            {tournament.endTime && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Fin</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(tournament.endTime).toLocaleString('es-ES')}
                </dd>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 