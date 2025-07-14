import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const assignPrizesSchema = z.object({
  assignments: z.array(z.object({
    playerId: z.string(),
    position: z.number().positive(),
    amount: z.number().positive()
  }))
})

export async function POST(
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
    const { assignments } = assignPrizesSchema.parse(body)

    // Verificar que el torneo existe y tiene los permisos correctos
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        players: true,
        prizes: true
      }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }

    if (tournament.organizerId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado para modificar este torneo' }, { status: 403 })
    }

    // Verificar que el torneo esté finalizado
    if (tournament.status !== 'FINISHED') {
      return NextResponse.json({ error: 'Solo se pueden asignar premios en torneos finalizados' }, { status: 400 })
    }

    // Verificar que todos los jugadores existen en el torneo
    const tournamentPlayerIds = tournament.players.map(p => p.id)
    const invalidPlayers = assignments.filter(a => !tournamentPlayerIds.includes(a.playerId))
    
    if (invalidPlayers.length > 0) {
      return NextResponse.json({ error: 'Algunos jugadores no pertenecen al torneo' }, { status: 400 })
    }

    // Verificar que las posiciones existen en la estructura de premios
    const prizePositions = tournament.prizes.map(p => p.position)
    const invalidPositions = assignments.filter(a => !prizePositions.includes(a.position))
    
    if (invalidPositions.length > 0) {
      return NextResponse.json({ error: 'Algunas posiciones no existen en la estructura de premios' }, { status: 400 })
    }

    // Verificar que no hay duplicados de jugadores o posiciones
    const playerIds = assignments.map(a => a.playerId)
    const positions = assignments.map(a => a.position)
    
    if (new Set(playerIds).size !== playerIds.length) {
      return NextResponse.json({ error: 'No se puede asignar múltiples premios al mismo jugador' }, { status: 400 })
    }
    
    if (new Set(positions).size !== positions.length) {
      return NextResponse.json({ error: 'No se puede asignar la misma posición a múltiples jugadores' }, { status: 400 })
    }

    // Realizar la asignación en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar las posiciones de los jugadores
      const playerUpdates = assignments.map(assignment => 
        tx.player.update({
          where: { id: assignment.playerId },
          data: { position: assignment.position }
        })
      )

      // Crear transacciones de premios
      const prizeTransactions = assignments.map(assignment => 
        tx.transaction.create({
          data: {
            type: 'PRIZE',
            amount: assignment.amount,
            description: `Premio ${assignment.position}° lugar`,
            tournamentId: id,
            playerId: assignment.playerId,
            userId: decoded.userId
          }
        })
      )

      // Ejecutar todas las operaciones
      await Promise.all([...playerUpdates, ...prizeTransactions])

      // Registrar en el log de auditoría
      await tx.auditLog.create({
        data: {
          userId: decoded.userId,
          action: 'ASSIGN_PRIZES',
          details: `Asignó premios a ${assignments.length} jugadores`,
          tournamentId: id
        }
      })

      return { success: true }
    })

    // Obtener el torneo actualizado
    const updatedTournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        players: {
          orderBy: { position: 'asc' }
        },
        transactions: {
          where: { type: 'PRIZE' },
          include: {
            player: {
              select: { name: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Premios asignados exitosamente',
      tournament: updatedTournament,
      assignments: assignments.length
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error asignando premios:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 