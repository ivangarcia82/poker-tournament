import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { scheduleAutomaticSnapshots } from '@/lib/backup'

// Declarar el tipo global para io
declare global {
  var io: any
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        players: true,
        blindStructure: true
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
      
      if (tournament.pausedTimeRemaining !== null && tournament.pausedAt) {
        // Torneo pausado
        isPaused = true
        // El tiempo no avanza mientras está pausado
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
      } else {
        // Torneo en curso
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)
        
        // Calcular nivel actual y tiempo restante
        let totalDuration = 0
        for (let i = 0; i < tournament.blindStructure.length; i++) {
          const levelDuration = tournament.blindStructure[i].duration * 60
          if (elapsedSeconds < totalDuration + levelDuration) {
            currentLevel = i
            timeRemaining = (totalDuration + levelDuration) - elapsedSeconds
            break
          }
          totalDuration += levelDuration
        }
      }
    }

    return NextResponse.json({
      id: tournament.id,
      status: tournament.status,
      currentLevel,
      timeRemaining,
      isPaused,
      startTime: tournament.startTime,
      endTime: tournament.endTime
    })
  } catch (error) {
    console.error('Error obteniendo estado del torneo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'ORGANIZER' && decoded.role !== 'STAFF')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const updates: any = {}
    let shouldTakeSnapshot = false

    // Procesar actualizaciones
    if (body.status) {
      updates.status = body.status
      if (body.status === 'RUNNING') {
        // Si se proporciona un startTime específico, usarlo; sino usar la hora actual
        updates.startTime = body.startTime ? new Date(body.startTime) : new Date()
        shouldTakeSnapshot = true // Snapshot al iniciar
      } else if (body.status === 'FINISHED') {
        updates.endTime = new Date()
        shouldTakeSnapshot = true // Snapshot al finalizar
      }
    }

    // Manejar cambios de startTime independientes del status
    if (body.startTime && body.status !== 'RUNNING') {
      updates.startTime = new Date(body.startTime)
      shouldTakeSnapshot = true
    }

    // Procesar cambios de nivel y tiempo restante
    if (body.currentLevel !== undefined || body.timeRemaining !== undefined) {
      const torneoActual = await prisma.tournament.findUnique({
        where: { id },
        include: { blindStructure: { orderBy: { level: 'asc' } } }
      })
      
      if (torneoActual) {
        let targetLevel = body.currentLevel !== undefined ? body.currentLevel : 0
        let targetTimeRemaining = body.timeRemaining !== undefined ? body.timeRemaining : 0
        
        // Calcular el tiempo total transcurrido hasta el nivel objetivo
        let totalElapsedSeconds = 0
        for (let i = 0; i < targetLevel; i++) {
          totalElapsedSeconds += torneoActual.blindStructure[i].duration * 60
        }
        
        // Agregar el tiempo transcurrido en el nivel actual
        const currentLevelDuration = torneoActual.blindStructure[targetLevel]?.duration * 60 || 0
        const elapsedInCurrentLevel = currentLevelDuration - targetTimeRemaining
        totalElapsedSeconds += elapsedInCurrentLevel
        
        // Calcular el nuevo startTime para que el reloj refleje el nivel y tiempo deseados
        const newStartTime = new Date(Date.now() - (totalElapsedSeconds * 1000))
        updates.startTime = newStartTime
        shouldTakeSnapshot = true
      }
    }

    if (body.isPaused !== undefined) {
      if (body.isPaused) {
        updates.pausedAt = new Date()
        updates.pausedTimeRemaining = body.timeRemaining || 0
        shouldTakeSnapshot = true // Snapshot al pausar
      } else {
        // Al reanudar, ajustar startTime para compensar el tiempo pausado
        const torneoActual = await prisma.tournament.findUnique({
          where: { id },
          include: { blindStructure: { orderBy: { level: 'asc' } } }
        })
        if (torneoActual && torneoActual.pausedTimeRemaining !== null) {
          // Determinar el nivel actual según el tiempo restante
          let nivelActual = 0
          let acumulado = 0
          for (let i = 0; i < torneoActual.blindStructure.length; i++) {
            acumulado += torneoActual.blindStructure[i].duration * 60
            if (torneoActual.pausedTimeRemaining <= acumulado) {
              nivelActual = i
              break
            }
          }
          // Calcular cuánto tiempo ha transcurrido en el nivel actual
          const nivel = torneoActual.blindStructure[nivelActual]
          const segundosTranscurridosEnNivel = (nivel.duration * 60) - torneoActual.pausedTimeRemaining + (acumulado - nivel.duration * 60)
          // Nuevo startTime = ahora - segundosTranscurridosEnNivel
          const nuevoStartTime = new Date(Date.now() - segundosTranscurridosEnNivel * 1000)
          updates.startTime = nuevoStartTime
        }
        updates.pausedAt = null
        updates.pausedTimeRemaining = null
        shouldTakeSnapshot = true // Snapshot al reanudar
      }
    }

    // Actualizar torneo (removiendo campos que no existen en el esquema)
    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: updates,
      include: {
        blindStructure: {
          orderBy: { level: 'asc' }
        }
      }
    })

    // Tomar snapshot automático si es necesario
    if (shouldTakeSnapshot) {
      try {
        await scheduleAutomaticSnapshots(id)
        console.log(`📸 Snapshot automático tomado para torneo ${id}`)
      } catch (error) {
        console.error('Error tomando snapshot automático:', error)
      }
    }

    // Calcular estado actual del reloj después de la actualización
    let currentLevel = 0
    let timeRemaining = 0
    let isPaused = false

    if (updatedTournament.status === 'RUNNING' && updatedTournament.startTime) {
      const startTime = new Date(updatedTournament.startTime)
      const now = new Date()
      
      if (updatedTournament.pausedTimeRemaining !== null && updatedTournament.pausedAt) {
        // Torneo pausado
        isPaused = true
        // El tiempo no avanza mientras está pausado
        timeRemaining = updatedTournament.pausedTimeRemaining
        // Calcular nivel actual basado en el tiempo restante
        let totalDuration = 0
        for (let i = 0; i < updatedTournament.blindStructure.length; i++) {
          const levelDuration = updatedTournament.blindStructure[i].duration * 60
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
        for (let i = 0; i < updatedTournament.blindStructure.length; i++) {
          const levelDuration = updatedTournament.blindStructure[i].duration * 60
          if (elapsedSeconds < totalDuration + levelDuration) {
            currentLevel = i
            timeRemaining = (totalDuration + levelDuration) - elapsedSeconds
            break
          }
          totalDuration += levelDuration
        }
      }
    }

    // Emitir evento WebSocket si está disponible
    if (global.io) {
      const eventData = {
        tournamentId: id,
        currentLevel,
        timeRemaining,
        status: updatedTournament.status,
        isPaused: updatedTournament.pausedAt !== null
      }

      global.io.to(`tournament:${id}`).emit('tournament:clock:update', eventData)
      console.log('📡 Emitido evento de actualización del reloj:', eventData)
    }

    return NextResponse.json({
      id: updatedTournament.id,
      status: updatedTournament.status,
      currentLevel,
      timeRemaining,
      isPaused: updatedTournament.pausedAt !== null,
      startTime: updatedTournament.startTime,
      endTime: updatedTournament.endTime
    })
  } catch (error) {
    console.error('Error actualizando estado del torneo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 