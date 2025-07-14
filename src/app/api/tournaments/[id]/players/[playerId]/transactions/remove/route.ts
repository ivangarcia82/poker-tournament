import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const removeTransactionSchema = z.object({
  type: z.enum(['rebuy', 'add-on'])
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id: tournamentId, playerId } = await params
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const data = removeTransactionSchema.parse(body)

    // Obtener torneo y jugador
    const tournament = await prisma.tournament.findUnique({ 
      where: { id: tournamentId }
    })
    
    if (!tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }

    if (tournament.organizerId !== decoded.userId && decoded.role !== 'ADMIN' && decoded.role !== 'STAFF') {
      return NextResponse.json({ error: 'No autorizado para modificar este torneo' }, { status: 403 })
    }

    const player = await prisma.player.findUnique({ 
      where: { id: playerId },
      include: {
        transactions: {
          where: {
            type: data.type === 'rebuy' ? 'REBUY' : 'ADD_ON'
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    if (player.transactions.length === 0) {
      return NextResponse.json({ 
        error: data.type === 'rebuy' ? 'El jugador no tiene recompras para eliminar' : 'El jugador no tiene add-ons para eliminar'
      }, { status: 400 })
    }

    const transactionToRemove = player.transactions[0]
    const chipsToRemove = Math.abs(transactionToRemove.amount)

    // Eliminar la transacción y ajustar fichas
    await prisma.$transaction(async (tx) => {
      // Eliminar la transacción
      await tx.transaction.delete({
        where: { id: transactionToRemove.id }
      })

      // Reducir fichas del jugador
      await tx.player.update({
        where: { id: playerId },
        data: { 
          chips: { decrement: chipsToRemove },
          ...(data.type === 'add-on' ? { addOns: { decrement: 1 } } : {})
        }
      })

      // Crear log de auditoría
      await tx.auditLog.create({
        data: {
          userId: decoded.userId,
          action: `REMOVE_${data.type.toUpperCase()}`,
          details: `Eliminó ${data.type} de ${chipsToRemove} fichas por $${transactionToRemove.amount}`,
          tournamentId,
          playerId
        }
      })
    })

    return NextResponse.json({ 
      message: `${data.type === 'rebuy' ? 'Recompra' : 'Add-on'} eliminado exitosamente`,
      removedChips: chipsToRemove,
      removedAmount: transactionToRemove.amount
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error eliminando transacción:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 