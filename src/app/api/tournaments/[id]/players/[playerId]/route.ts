import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import { emitToTournament } from '@/lib/socket'

const updatePlayerSchema = z.object({
  chips: z.number().min(0).optional(),
  isEliminated: z.boolean().optional(),
  position: z.number().positive().optional(),
  addOn: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id, playerId } = await params
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        transactions: true,
        tournament: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Jugador no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(player)
  } catch (error) {
    console.error('Error obteniendo jugador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id, playerId } = await params
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = updatePlayerSchema.parse(body)

    // Verificar que el jugador existe
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        tournament: {
          select: {
            organizerId: true,
            status: true,
            addOn: true
          }
        }
      }
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Jugador no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos
    if (player.tournament.organizerId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado para modificar este jugador' },
        { status: 403 }
      )
    }

    const updateData: any = {}
    const transactions = []

    // Actualizar chips
    if (data.chips !== undefined) {
      updateData.chips = data.chips
    }

    // Marcar como eliminado
    if (data.isEliminated !== undefined) {
      updateData.isEliminated = data.isEliminated
      if (data.isEliminated) {
        updateData.eliminatedAt = new Date()
      } else {
        updateData.eliminatedAt = null
      }
    }

    // Asignar posición
    if (data.position !== undefined) {
      updateData.position = data.position
    }

    // Procesar add-on
    if (data.addOn && player.tournament.addOn && player.tournament.addOn > 0) {
      updateData.addOns = { increment: 1 }
      transactions.push({
        type: 'ADD_ON' as const,
        amount: player.tournament.addOn,
        description: `Add-on para ${player.name}`,
        tournamentId: id,
        playerId: playerId,
        userId: decoded.userId
      })
    }

    // Actualizar jugador
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        transactions: true
      }
    })

    // Crear transacciones si hay add-ons
    if (transactions.length > 0) {
      await prisma.transaction.createMany({
        data: transactions
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'EDIT_PLAYER',
        details: `Actualizó datos del jugador ${playerId}`,
        tournamentId: id,
        playerId
      }
    })

    return NextResponse.json({
      message: 'Jugador actualizado exitosamente',
      player: updatedPlayer
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error actualizando jugador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id, playerId } = await params
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Verificar que el jugador existe y obtener información del torneo
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        tournament: {
          select: {
            organizerId: true,
            status: true
          }
        }
      }
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Jugador no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos
    if (player.tournament.organizerId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado para eliminar este jugador' },
        { status: 403 }
      )
    }

    let body: any = {}
    let type = null
    
    try {
      body = await request.json()
      type = body.type
    } catch (error) {
      // Si no hay cuerpo en la petición, continuar sin tipo
      console.log('No body in DELETE request, proceeding without type')
    }

    // Si no se especifica tipo, eliminar el jugador completamente
    if (!type) {
      // Eliminar jugador completamente del torneo
      await prisma.$transaction([
        // Eliminar todas las transacciones del jugador
        prisma.transaction.deleteMany({
          where: { playerId, tournamentId: id }
        }),
        // Eliminar todos los pagos del jugador
        prisma.playerPayment.deleteMany({
          where: { playerId, tournamentId: id }
        }),
        // Eliminar el jugador
        prisma.player.delete({
          where: { id: playerId }
        }),
        // Registrar en audit log
        prisma.auditLog.create({
          data: {
            userId: decoded.userId,
            action: 'DELETE_PLAYER',
            details: `Eliminó completamente al jugador ${player.name} del torneo`,
            tournamentId: id,
            playerId
          }
        })
      ])

      return NextResponse.json({ 
        message: 'Jugador eliminado completamente del torneo' 
      })
    }

    // Si el tipo es 'eliminate', marcar como eliminado
    if (type === 'eliminate') {
      await prisma.$transaction([
        prisma.player.update({
          where: { id: playerId },
          data: { 
            isEliminated: true,
            eliminatedAt: new Date()
          }
        }),
        prisma.auditLog.create({
          data: {
            userId: decoded.userId,
            action: 'ELIMINATE_PLAYER',
            details: `Marcó como eliminado al jugador ${player.name}`,
            tournamentId: id,
            playerId
          }
        })
      ])

      // Emitir evento de eliminación a todos los clientes del torneo
      if (global.io) {
        console.log(`📡 Emitiendo evento de eliminación para torneo ${id}, jugador ${player.name}`)
        global.io.to(`tournament-${id}`).emit('tournament:player:eliminated', {
          tournamentId: id,
          playerId: playerId,
          playerName: player.name,
          eliminatedAt: new Date()
        })
      }

      return NextResponse.json({ 
        message: 'Jugador marcado como eliminado' 
      })
    }

    // Si el tipo es 'reactivate', reactivar al jugador
    if (type === 'reactivate') {
      await prisma.$transaction([
        prisma.player.update({
          where: { id: playerId },
          data: { 
            isEliminated: false,
            eliminatedAt: null,
            position: null // Resetear posición si la tenía
          }
        }),
        prisma.auditLog.create({
          data: {
            userId: decoded.userId,
            action: 'REACTIVATE_PLAYER',
            details: `Reactivó al jugador ${player.name}`,
            tournamentId: id,
            playerId
          }
        })
      ])

      // Emitir evento de reactivación a todos los clientes del torneo
      if (global.io) {
        console.log(`📡 Emitiendo evento de reactivación para torneo ${id}, jugador ${player.name}`)
        global.io.to(`tournament-${id}`).emit('tournament:player:reactivated', {
          tournamentId: id,
          playerId: playerId,
          playerName: player.name
        })
      }

      return NextResponse.json({ 
        message: 'Jugador reactivado exitosamente' 
      })
    }

    // Si se especifica tipo, eliminar transacción específica
    let filter: any = { playerId, tournamentId: id }
    let chipsToRemove = 0

    if (type === 'single-rebuy') {
      filter.type = 'REBUY'
      filter.OR = [
        { description: null },
        { description: { contains: 'sencilla' } }
      ]
    } else if (type === 'double-rebuy') {
      filter.type = 'REBUY'
      filter.description = { contains: 'doble' }
    } else if (type === 'add-on') {
      filter.type = 'ADD_ON'
    } else {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    // Buscar la última transacción
    const lastTx = await prisma.transaction.findFirst({
      where: filter,
      orderBy: { createdAt: 'desc' }
    })

    if (!lastTx) {
      return NextResponse.json({ error: 'No hay transacción para eliminar' }, { status: 400 })
    }

    // Determinar cuántas fichas restar
    if (type === 'single-rebuy') {
      const tournament = await prisma.tournament.findUnique({ where: { id } })
      chipsToRemove = tournament?.rebuyChips || 0
    } else if (type === 'double-rebuy') {
      const tournament = await prisma.tournament.findUnique({ where: { id } })
      chipsToRemove = tournament?.doubleRebuyChips || 0
    } else if (type === 'add-on') {
      const tournament = await prisma.tournament.findUnique({ where: { id } })
      chipsToRemove = tournament?.addOn || 0
    }

    // Eliminar la transacción y restar fichas
    await prisma.$transaction([
      prisma.transaction.delete({ where: { id: lastTx.id } }),
      prisma.player.update({
        where: { id: playerId },
        data: { chips: { decrement: chipsToRemove } }
      }),
      prisma.auditLog.create({
        data: {
          userId: decoded.userId,
          action: `REMOVE_${type.toUpperCase()}`,
          details: `Eliminó la última transacción de tipo ${type} al jugador ${playerId}`,
          tournamentId: id,
          playerId
        }
      })
    ])

    return NextResponse.json({ message: 'Transacción eliminada y stack ajustado' })
  } catch (error) {
    console.error('Error eliminando jugador/transacción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 