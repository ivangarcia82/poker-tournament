import { prisma } from './db'

export interface TournamentState {
  id: string
  status: string
  currentLevel?: number
  timeRemaining?: number
  isPaused: boolean
  pausedAt?: Date
  pausedTimeRemaining?: number
  players: any[]
  transactions?: any[]
  payments?: any[]
  bonuses?: any[]
}

/**
 * Toma un snapshot automático del estado actual del torneo
 */
export async function takeTournamentSnapshot(
  tournamentId: string, 
  description?: string,
  isAutomatic: boolean = true
) {
  try {
    // Obtener el torneo con todos sus datos relacionados
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        players: {
          include: {
            transactions: true
          }
        },
        blindStructure: true
      }
    })

    if (!tournament) {
      throw new Error('Torneo no encontrado')
    }

    // Preparar el estado de los jugadores
    const playersState = (tournament as any).players?.map((player: any) => ({
      id: player.id,
      name: player.name,
      email: player.email,
      phone: player.phone,
      chips: player.chips,
      isEliminated: player.isEliminated,
      position: player.position,
      buyIns: player.buyIns,
      addOns: player.addOns,
      rebuys: player.rebuys,
      doubleRebuys: player.doubleRebuys,
      deuda: player.deuda,
      pagado: player.pagado,
      clubPlayerId: player.clubPlayerId,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt
    })) || []

    // Preparar el estado de las transacciones
    const transactionsState = (tournament as any).players?.flatMap((player: any) => 
      player.transactions?.map((tx: any) => ({
        id: tx.id,
        playerId: tx.playerId,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        createdAt: tx.createdAt
      })) || []
    ) || []

    // Preparar el estado de los pagos (obtener desde PlayerPayment)
    const payments = await prisma.playerPayment.findMany({
      where: {
        player: {
          tournamentId: tournamentId
        }
      }
    })

    const paymentsState = payments.map((payment: any) => ({
      id: payment.id,
      playerId: payment.playerId,
      amount: payment.amount,
      method: payment.method,
      description: payment.description,
      createdAt: payment.createdAt
    }))

    // Preparar el estado de los bonos (obtener desde Bonus)
    const bonuses = await prisma.bonus.findMany({
      where: {
        tournamentId: tournamentId
      }
    })

    const bonusesState = bonuses.map((bonus: any) => ({
      id: bonus.id,
      name: bonus.name,
      chips: bonus.chips,
      price: bonus.price,
      createdAt: bonus.createdAt
    }))

    // Crear el snapshot
    const snapshot = await prisma.tournamentSnapshot.create({
      data: {
        tournamentId,
        status: tournament.status,
        currentLevel: (tournament as any).currentLevel,
        timeRemaining: (tournament as any).timeRemaining,
        isPaused: tournament.pausedAt !== null,
        pausedAt: tournament.pausedAt,
        pausedTimeRemaining: tournament.pausedTimeRemaining,
        players: playersState,
        transactions: transactionsState,
        payments: paymentsState,
        bonuses: bonusesState,
        description: description || `Snapshot automático - ${new Date().toLocaleString()}`,
        isAutomatic
      }
    })

    console.log(`📸 Snapshot creado para torneo ${tournamentId}: ${snapshot.id}`)
    return snapshot
  } catch (error) {
    console.error('Error creando snapshot:', error)
    throw error
  }
}

/**
 * Restaura un torneo desde un snapshot
 */
export async function restoreTournamentFromSnapshot(snapshotId: string) {
  try {
    const snapshot = await prisma.tournamentSnapshot.findUnique({
      where: { id: snapshotId },
      include: {
        tournament: {
          include: {
            players: true
          }
        }
      }
    })

    if (!snapshot) {
      throw new Error('Snapshot no encontrado')
    }

    // Actualizar el estado del torneo
    await prisma.tournament.update({
      where: { id: snapshot.tournamentId },
      data: {
        status: snapshot.status as any,
        pausedAt: snapshot.pausedAt,
        pausedTimeRemaining: snapshot.pausedTimeRemaining
      }
    })

    // Restaurar jugadores
    const playersData = snapshot.players as any[]
    for (const playerData of playersData) {
      await prisma.player.update({
        where: { id: playerData.id },
        data: {
          chips: playerData.chips,
          isEliminated: playerData.isEliminated,
          position: playerData.position,
          addOns: playerData.addOns
        }
      })
    }

    console.log(`🔄 Torneo restaurado desde snapshot ${snapshotId}`)
    return snapshot
  } catch (error) {
    console.error('Error restaurando desde snapshot:', error)
    throw error
  }
}

/**
 * Obtiene todos los snapshots de un torneo
 */
export async function getTournamentSnapshots(tournamentId: string) {
  try {
    const snapshots = await prisma.tournamentSnapshot.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'desc' }
    })

    return snapshots
  } catch (error) {
    console.error('Error obteniendo snapshots:', error)
    throw error
  }
}

/**
 * Elimina snapshots antiguos (más de 30 días) para mantener la base de datos limpia
 */
export async function cleanupOldSnapshots() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const deletedSnapshots = await prisma.tournamentSnapshot.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        },
        isAutomatic: true // Solo eliminar snapshots automáticos
      }
    })

    console.log(`🧹 Limpiados ${deletedSnapshots.count} snapshots antiguos`)
    return deletedSnapshots.count
  } catch (error) {
    console.error('Error limpiando snapshots antiguos:', error)
    throw error
  }
}

/**
 * Programa snapshots automáticos basados en eventos del torneo
 */
export async function scheduleAutomaticSnapshots(tournamentId: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    })

    if (!tournament) return

    // Tomar snapshot en momentos clave
    const shouldTakeSnapshot = 
      tournament.status === 'RUNNING' || 
      tournament.status === 'PAUSED' ||
      tournament.status === 'FINISHED'

    if (shouldTakeSnapshot) {
      await takeTournamentSnapshot(tournamentId, undefined, true)
    }
  } catch (error) {
    console.error('Error programando snapshot automático:', error)
  }
} 