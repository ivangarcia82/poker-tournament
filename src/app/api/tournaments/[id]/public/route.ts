import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        players: {
          where: { isEliminated: false },
          orderBy: { position: 'asc' }
        },
        blindStructure: {
          orderBy: { level: 'asc' }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }

    // Calcular estado actual del reloj
    let currentLevel = 0
    let timeRemaining = 0
    let isPaused = false

    if (tournament.status === 'RUNNING' && tournament.startTime) {
      const startTime = new Date(tournament.startTime)
      const now = new Date()
      
      // Si el startTime está en el futuro, el torneo aún no ha empezado
      if (startTime > now) {
        timeRemaining = Math.floor((startTime.getTime() - now.getTime()) / 1000)
        currentLevel = 0
        isPaused = false
      } else if (tournament.pausedTimeRemaining !== null && tournament.pausedAt) {
        // Torneo pausado
        isPaused = true
        const pausedAt = new Date(tournament.pausedAt)
        const pausedSeconds = Math.floor((now.getTime() - pausedAt.getTime()) / 1000)
        timeRemaining = Math.max(0, tournament.pausedTimeRemaining - pausedSeconds)
        
        // Calcular nivel actual basado en el tiempo restante
        let totalDuration = 0
        for (let i = 0; i < tournament.blindStructure.length; i++) {
          const levelDuration = tournament.blindStructure[i].duration * 60
          if (timeRemaining <= totalDuration + levelDuration) {
            currentLevel = i
            break
          }
          totalDuration += levelDuration
        }
      } else {
        // Torneo en curso
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)
        
        // Calcular nivel actual y tiempo restante
        let totalDuration = 0
        let foundLevel = false
        
        for (let i = 0; i < tournament.blindStructure.length; i++) {
          const levelDuration = tournament.blindStructure[i].duration * 60
          
          if (elapsedSeconds < totalDuration + levelDuration) {
            currentLevel = i
            timeRemaining = (totalDuration + levelDuration) - elapsedSeconds
            foundLevel = true
            break
          }
          
          totalDuration += levelDuration
        }
        
        // Si no se encontró nivel, el torneo ha terminado
        if (!foundLevel) {
          currentLevel = tournament.blindStructure.length - 1
          timeRemaining = 0
        }
      }
    } else if (tournament.status === 'PAUSED' && tournament.pausedTimeRemaining !== null) {
      // Torneo pausado pero sin pausedAt (estado inicial de pausa)
      isPaused = true
      timeRemaining = tournament.pausedTimeRemaining
      
      // Calcular nivel actual basado en el tiempo restante
      let totalDuration = 0
      for (let i = 0; i < tournament.blindStructure.length; i++) {
        const levelDuration = tournament.blindStructure[i].duration * 60
        if (timeRemaining <= totalDuration + levelDuration) {
          currentLevel = i
          break
        }
        totalDuration += levelDuration
      }
    } else if (tournament.status === 'REGISTERING') {
      // Torneo no iniciado
      timeRemaining = tournament.blindStructure[0]?.duration * 60 || 0
      currentLevel = 0
      isPaused = false
    }

    // Calcular estadísticas
    const activePlayers = tournament.players.filter(p => !p.isEliminated)
    const totalChips = tournament.players.reduce((sum, p) => sum + p.chips, 0)
    const averageChips = activePlayers.length > 0 ? Math.floor(totalChips / activePlayers.length) : 0

    const response = {
      id: tournament.id,
      name: tournament.name,
      status: tournament.status,
      currentLevel,
      timeRemaining,
      isPaused,
      startTime: tournament.startTime,
      endTime: tournament.endTime,
      activePlayers: activePlayers.length,
      totalPlayers: tournament.players.length,
      totalChips,
      averageChips,
      currentBlind: tournament.blindStructure[currentLevel] || tournament.blindStructure[0],
      debug: {
        startTime: tournament.startTime,
        pausedTimeRemaining: tournament.pausedTimeRemaining,
        pausedAt: tournament.pausedAt,
        status: tournament.status,
        blindStructureLength: tournament.blindStructure.length,
        now: new Date().toISOString(),
        startTimeIsFuture: tournament.startTime ? new Date(tournament.startTime) > new Date() : false
      }
    }

    console.log('📊 Datos públicos del torneo:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error obteniendo información pública del torneo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 