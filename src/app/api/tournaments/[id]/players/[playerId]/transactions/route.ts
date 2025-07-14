import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const transactionSchema = z.object({
  type: z.enum(['BUY_IN', 'REBUY', 'ADD_ON']),
  isDouble: z.boolean().default(false),
  selectedBonuses: z.array(z.string()).default([]),
  amount: z.number().min(0),
  chips: z.number().min(0)
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
    const data = transactionSchema.parse(body)

    // Obtener torneo y jugador
    const tournament = await prisma.tournament.findUnique({ 
      where: { id: tournamentId },
      include: { bonuses: true }
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
        playerBonuses: {
          select: { bonusId: true }
        }
      }
    })
    
    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    // Validar tipo de transacción
    if (data.type === 'BUY_IN' && player.chips > 0) {
      return NextResponse.json({ error: 'El jugador ya tiene fichas iniciales' }, { status: 400 })
    }

    if (data.type === 'ADD_ON' && player.addOns > 0) {
      return NextResponse.json({ error: 'El jugador ya tiene un add-on' }, { status: 400 })
    }

    // Validar bonos seleccionados
    const selectedBonuses = tournament.bonuses.filter(bonus => 
      data.selectedBonuses.includes(bonus.id)
    )

    // Verificar que los bonos no estén ya asignados al jugador
    const existingBonusIds = player.playerBonuses.map(pb => pb.bonusId)
    const newBonuses = selectedBonuses.filter(bonus => !existingBonusIds.includes(bonus.id))

    // Calcular totales
    let totalAmount = data.amount
    let totalChips = data.chips

    // Agregar bonos
    for (const bonus of selectedBonuses) {
      totalAmount += bonus.price
      totalChips += bonus.chips
    }

    // Crear transacciones
    const transactions: Array<{
      type: 'BUY_IN' | 'REBUY' | 'ADD_ON'
      amount: number
      description: string
      tournamentId: string
      playerId: string
      userId: string
    }> = []

    // Transacción principal
    transactions.push({
      type: data.type,
      amount: data.amount,
      description: `${data.type === 'BUY_IN' ? 'Compra inicial' : data.type === 'ADD_ON' ? 'Add-on' : 'Recompra'}${data.isDouble ? ' doble' : ''}`,
      tournamentId,
      playerId,
      userId: decoded.userId
    })

    // Transacciones de bonos
    for (const bonus of selectedBonuses) {
      transactions.push({
        type: data.type,
        amount: bonus.price,
        description: `Bono: ${bonus.name}`,
        tournamentId,
        playerId,
        userId: decoded.userId
      })
    }

    // Ejecutar transacciones
    await prisma.$transaction(async (tx) => {
      // Crear transacciones
      await tx.transaction.createMany({
        data: transactions
      })

      // Actualizar fichas del jugador
      await tx.player.update({
        where: { id: playerId },
        data: { 
          chips: { increment: totalChips },
          ...(data.type === 'ADD_ON' ? { addOns: { increment: 1 } } : {})
        }
      })

      // Asignar bonos al jugador
      for (const bonus of newBonuses) {
        await tx.playerBonus.create({
          data: {
            playerId,
            bonusId: bonus.id,
            appliedAt: new Date()
          }
        })
      }

      // Crear log de auditoría
      await tx.auditLog.create({
        data: {
          userId: decoded.userId,
          action: data.type,
          details: `${data.type} de ${totalChips} fichas por $${totalAmount}${newBonuses.length > 0 ? ` con ${newBonuses.length} bonos nuevos` : ''}`,
          tournamentId,
          playerId
        }
      })
    })

    return NextResponse.json({ 
      message: 'Transacción aplicada exitosamente',
      totalAmount,
      totalChips,
      bonuses: newBonuses.length
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error procesando transacción:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id: tournamentId, playerId } = await params

    const transactions = await prisma.transaction.findMany({
      where: { 
        tournamentId,
        playerId,
        type: { in: ['BUY_IN', 'REBUY'] }
      },
      include: {
        player: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error obteniendo transacciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 