export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'ORGANIZER' | 'USER' | 'STAFF'
  createdAt: Date
  updatedAt: Date
}

export interface Tournament {
  id: string
  name: string
  description?: string
  buyIn: number
  doubleBuyIn: boolean
  doubleBuyInPrice?: number
  doubleBuyInChips?: number
  addOn?: number
  addOnChips?: number
  rake: number
  maxPlayers: number
  minPlayers: number
  startTime: Date
  endTime?: Date
  status: 'REGISTERING' | 'STARTING' | 'RUNNING' | 'PAUSED' | 'FINISHED' | 'CANCELLED'
  initialStack: number
  rebuy?: number
  rebuyChips?: number
  doubleRebuy: boolean
  doubleRebuyPrice?: number
  doubleRebuyChips?: number
  pauseLevel: number
  pausedAt?: Date
  pausedTimeRemaining?: number
  organizerId: string
  organizer: User
  createdAt: Date
  updatedAt: Date
  blindStructure: BlindStructure[]
  prizes: Prize[]
  players: Player[]
  transactions: Transaction[]
  bonuses: Bonus[]
}

export interface Bonus {
  id: string
  name: string
  chips: number
  price: number
  availableInBuyIn: boolean
  availableInRebuy: boolean
  availableInAddOn: boolean
  description?: string
  tournamentId: string
  tournament: Tournament
  playerBonuses: PlayerBonus[]
  createdAt: Date
  updatedAt: Date
}

export interface PlayerBonus {
  id: string
  playerId: string
  player: Player
  bonusId: string
  bonus: Bonus
  appliedAt: Date
}

export interface BlindStructure {
  id: string
  level: number
  smallBlind: number
  bigBlind: number
  ante: number
  duration: number
  isPause: boolean
  tournamentId: string
  createdAt: Date
  updatedAt: Date
}

export interface Player {
  id: string
  name: string
  email?: string
  phone?: string
  chips: number
  position?: number
  isEliminated: boolean
  eliminatedAt?: Date
  addOns: number
  hasDoubleRebuyAccess: boolean
  tournamentId: string
  userId?: string
  user?: User
  createdAt: Date
  updatedAt: Date
  transactions: Transaction[]
  playerPayments?: { id: string; amount: number; method: string; reference?: string | null; paidAt: string; notes?: string | null }[]
}

export interface Prize {
  id: string
  position: number
  amount: number
  percentage: number
  tournamentId: string
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  type: 'BUY_IN' | 'ADD_ON' | 'REBUY' | 'PRIZE' | 'RAKE' | 'REFUND' | 'OTHER'
  amount: number
  description?: string
  tournamentId: string
  playerId?: string
  player?: Player
  userId?: string
  user?: User
  createdAt: Date
  updatedAt: Date
}

export interface TournamentStats {
  totalBuyIns: number
  totalAddOns: number
  totalRake: number
  totalPrizePool: number
  activePlayers: number
  eliminatedPlayers: number
}

export interface CreateTournamentData {
  name: string
  description?: string
  buyIn: number
  addOn?: number
  rake: number
  maxPlayers: number
  minPlayers: number
  startTime: Date
  blindStructure: Omit<BlindStructure, 'id' | 'tournamentId' | 'createdAt' | 'updatedAt'>[]
  bonuses: Bonus[]
}

export interface CreatePlayerData {
  name: string
  email?: string
  phone?: string
  tournamentId: string
  userId?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface ClubPlayer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  notes?: string | null
} 