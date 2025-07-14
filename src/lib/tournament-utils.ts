export interface PrizeStructure {
  position: number
  percentage: number
  amount: number
}

export interface TournamentStats {
  totalBuyIns: number
  totalAddOns: number
  totalRake: number
  totalPrizePool: number
  activePlayers: number
  eliminatedPlayers: number
}

export function calculatePrizePool(buyIn: number, addOn: number, players: number, rake: number): number {
  const totalBuyIns = buyIn * players
  const totalAddOns = addOn * players
  const totalRake = (totalBuyIns + totalAddOns) * (rake / 100)
  return totalBuyIns + totalAddOns - totalRake
}

export function calculatePrizes(prizePool: number, players: number): PrizeStructure[] {
  // Estructura de premios estándar para torneos de poker
  const prizePercentages = [
    { position: 1, percentage: 50 },
    { position: 2, percentage: 30 },
    { position: 3, percentage: 20 }
  ]

  // Si hay más de 3 jugadores, ajustar los premios
  if (players >= 6) {
    prizePercentages[0].percentage = 40
    prizePercentages[1].percentage = 25
    prizePercentages[2].percentage = 15
    prizePercentages.push({ position: 4, percentage: 10 })
  }

  if (players >= 9) {
    prizePercentages[0].percentage = 35
    prizePercentages[1].percentage = 22
    prizePercentages[2].percentage = 13
    prizePercentages[3].percentage = 8
    prizePercentages.push({ position: 5, percentage: 7 })
  }

  if (players >= 12) {
    prizePercentages[0].percentage = 30
    prizePercentages[1].percentage = 20
    prizePercentages[2].percentage = 12
    prizePercentages[3].percentage = 8
    prizePercentages[4].percentage = 6
    prizePercentages.push({ position: 6, percentage: 5 })
  }

  return prizePercentages.map(prize => ({
    position: prize.position,
    percentage: prize.percentage,
    amount: (prizePool * prize.percentage) / 100
  }))
}

export function calculateBlindLevel(currentLevel: number, baseSmallBlind: number): { smallBlind: number, bigBlind: number } {
  const smallBlind = baseSmallBlind * Math.pow(2, currentLevel - 1)
  const bigBlind = smallBlind * 2
  return { smallBlind, bigBlind }
}

export function calculateAnte(currentLevel: number, baseSmallBlind: number): number {
  // Ante típicamente se introduce en niveles más altos
  if (currentLevel < 4) return 0
  return Math.floor(baseSmallBlind * Math.pow(2, currentLevel - 4))
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export function calculateTimeRemaining(startTime: Date, levelDuration: number, currentLevel: number): number {
  const now = new Date()
  const elapsed = now.getTime() - startTime.getTime()
  const totalLevelTime = levelDuration * currentLevel * 60 * 1000 // convertir a milisegundos
  const remaining = totalLevelTime - elapsed
  return Math.max(0, Math.floor(remaining / (60 * 1000))) // convertir de vuelta a minutos
} 