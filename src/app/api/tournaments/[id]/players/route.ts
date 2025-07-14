import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const createPlayerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  userId: z.string().optional().or(z.literal('')),
  clubPlayerId: z.string().optional().or(z.literal('')),
  selectedBonuses: z.array(z.string()).optional().default([]), // IDs de bonos seleccionados
  enableDoubleRebuy: z.boolean().optional().default(false) // Habilitar acceso a recompra doble
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get('token')?.value
    let decoded = null
    if (token) {
      decoded = verifyToken(token)
    }
    // Si no hay token, solo mostrar información pública
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { organizerId: true }
    })
    if (!tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }
    // Si el torneo es privado, solo organizador/admin/staff pueden ver
    if (!decoded && process.env.PRIVATE_TOURNAMENTS === 'true') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (decoded && tournament.organizerId !== decoded.userId && decoded.role !== 'ADMIN' && decoded.role !== 'STAFF') {
      return NextResponse.json({ error: 'No autorizado para ver jugadores' }, { status: 403 })
    }
    const players = await prisma.player.findMany({
      where: { tournamentId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        transactions: true
      },
      orderBy: [
        { isEliminated: 'asc' },
        { chips: 'desc' }
      ]
    })

    return NextResponse.json(players)
  } catch (error) {
    console.error('Error obteniendo jugadores:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const data = createPlayerSchema.parse(body)

    // Limpiar campos vacíos
    const cleanData = {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      userId: data.userId || null,
      clubPlayerId: data.clubPlayerId || null
    }

    // Si se recibe clubPlayerId, obtener datos del ClubPlayer
    let playerData = { ...cleanData }
    if (cleanData.clubPlayerId) {
      const clubPlayer = await prisma.clubPlayer.findUnique({ where: { id: cleanData.clubPlayerId } })
      if (!clubPlayer) {
        return NextResponse.json({ error: 'ClubPlayer no encontrado' }, { status: 404 })
      }
      playerData = {
        ...playerData,
        name: clubPlayer.name,
        email: clubPlayer.email || null,
        phone: clubPlayer.phone || null,
        clubPlayerId: clubPlayer.id
      }
    }

    // Verificar que el torneo existe y está en estado de registro
    const tournament = await prisma.tournament.findUnique({
      where: { id: id },
      include: {
        bonuses: {
          where: {
            availableInBuyIn: true
          }
        },
        _count: {
          select: { players: true }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      )
    }

    if (tournament.status === 'FINISHED' || tournament.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'No se pueden agregar jugadores a un torneo finalizado o cancelado' },
        { status: 400 }
      )
    }

    if (tournament._count.players >= tournament.maxPlayers) {
      return NextResponse.json(
        { error: 'El torneo ya está lleno' },
        { status: 400 }
      )
    }

    // Verificar que el jugador no esté ya registrado
    if (playerData.userId) {
      const existingPlayer = await prisma.player.findFirst({
        where: {
          tournamentId: id,
          userId: playerData.userId
        }
      })

      if (existingPlayer) {
        return NextResponse.json(
          { error: 'El usuario ya está registrado en este torneo' },
          { status: 400 }
        )
      }
    }

    // Calcular bonos seleccionados y precio total
    let totalChips = tournament.initialStack
    let totalPrice = tournament.buyIn
    const initialBonuses: any[] = []

    // Verificar si se solicita buy-in doble
    const isDoubleBuyIn = data.enableDoubleRebuy && tournament.doubleBuyIn
    
    // Si es buy-in doble, usar los valores del buy-in doble
    if (isDoubleBuyIn) {
      totalChips = tournament.doubleBuyInChips || tournament.initialStack
      totalPrice = tournament.doubleBuyInPrice || tournament.buyIn
    }

    // Aplicar solo los bonos seleccionados
    if (data.selectedBonuses && data.selectedBonuses.length > 0) {
      for (const bonusId of data.selectedBonuses) {
        const bonus = tournament.bonuses.find(b => b.id === bonusId)
        if (bonus && bonus.availableInBuyIn) {
          totalChips += bonus.chips
          totalPrice += bonus.price
          initialBonuses.push(bonus)
        }
      }
    }

    // Crear jugador con fichas totales (incluyendo bonos)
    const player = await prisma.player.create({
      data: {
        name: playerData.name,
        email: playerData.email,
        phone: playerData.phone,
        tournamentId: id,
        userId: playerData.userId,
        chips: totalChips,
        clubPlayerId: playerData.clubPlayerId,
        // Agregar información de acceso a recompra doble si está habilitada
        hasDoubleRebuyAccess: data.enableDoubleRebuy || false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Crear transacción de buy-in con precio total
    if (totalPrice > 0) {
      await prisma.transaction.create({
        data: {
          type: 'BUY_IN' as const,
          amount: totalPrice,
          description: `Buy-in para ${playerData.name} (${tournament.buyIn} + ${initialBonuses.length} bonos)`,
          tournamentId: id,
          playerId: player.id,
          userId: decoded.userId
        }
      })
    }

    // Aplicar bonos al jugador
    for (const bonus of initialBonuses) {
      await prisma.playerBonus.create({
        data: {
          playerId: player.id,
          bonusId: bonus.id
        }
      })
    }

    return NextResponse.json({
      message: 'Jugador registrado exitosamente',
      player,
      appliedBonuses: initialBonuses.map(bonus => ({
        name: bonus.name,
        chips: bonus.chips,
        price: bonus.price
      })),
      totalPrice,
      totalChips
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Error de validación:', error.errors)
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error registrando jugador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 