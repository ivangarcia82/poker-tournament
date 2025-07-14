import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const applyBonusSchema = z.object({
  bonusId: z.string().min(1, 'ID del bono es requerido')
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id: tournamentId, playerId } = await params
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
    const data = applyBonusSchema.parse(body)

    // Verificar que el torneo existe
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { bonuses: true }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      )
    }

    if (tournament.organizerId !== decoded.userId && decoded.role !== 'ADMIN' && decoded.role !== 'STAFF') {
      return NextResponse.json({ error: 'No autorizado para modificar este torneo' }, { status: 403 })
    }

    // Verificar que el jugador existe
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { playerBonuses: true }
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Jugador no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el bono existe y pertenece al torneo
    const bonus = tournament.bonuses.find(b => b.id === data.bonusId)
    if (!bonus) {
      return NextResponse.json(
        { error: 'Bono no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el bono esté disponible según el contexto
    // Por ahora permitimos cualquier bono, pero en el futuro se puede filtrar por contexto
    // const context = request.nextUrl.searchParams.get('context') // 'buyIn' | 'rebuy'
    // if (context === 'buyIn' && !bonus.availableInBuyIn) {
    //   return NextResponse.json(
    //     { error: 'Este bono no está disponible para compra inicial' },
    //     { status: 400 }
    //   )
    // }
    // if (context === 'rebuy' && !bonus.availableInRebuy) {
    //   return NextResponse.json(
    //     { error: 'Este bono no está disponible para recompra' },
    //     { status: 400 }
    //   )
    // }

    // Verificar que el jugador no tenga ya este bono
    const existingBonus = player.playerBonuses.find(pb => pb.bonusId === data.bonusId)
    if (existingBonus) {
      return NextResponse.json(
        { error: 'El jugador ya tiene este bono aplicado' },
        { status: 400 }
      )
    }

    // Aplicar el bono
    await prisma.$transaction([
      // Crear la relación PlayerBonus
      prisma.playerBonus.create({
        data: {
          playerId: playerId,
          bonusId: data.bonusId
        }
      }),
      // Actualizar las fichas del jugador
      prisma.player.update({
        where: { id: playerId },
        data: {
          chips: {
            increment: bonus.chips
          }
        }
      }),
      // Crear transacción si el bono tiene precio
      ...(bonus.price > 0 ? [prisma.transaction.create({
        data: {
          type: 'OTHER',
          amount: bonus.price,
          description: `Bono: ${bonus.name}`,
          tournamentId: tournamentId,
          playerId: playerId,
          userId: decoded.userId
        }
      })] : []),
      // Registrar en AuditLog
      prisma.auditLog.create({
        data: {
          userId: decoded.userId,
          action: 'ASSIGN_BONUS',
          details: `Asignó bono ${bonus.name} (${bonus.chips} fichas, $${bonus.price}) al jugador ${playerId}`,
          tournamentId: tournamentId,
          playerId
        }
      })
    ])

    return NextResponse.json({
      message: 'Bono aplicado exitosamente',
      bonus: {
        name: bonus.name,
        chips: bonus.chips,
        price: bonus.price
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error aplicando bono:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id: tournamentId, playerId } = await params

    const playerBonuses = await prisma.playerBonus.findMany({
      where: { playerId },
      include: {
        bonus: true
      }
    })

    return NextResponse.json(playerBonuses)
  } catch (error) {
    console.error('Error obteniendo bonos del jugador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 