import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const updateTournamentSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  buyIn: z.number().positive('El buy-in debe ser positivo'),
  doubleBuyIn: z.boolean(),
  doubleBuyInPrice: z.number().optional(),
  doubleBuyInChips: z.number().optional(),
  addOn: z.number().optional(),
  addOnChips: z.number().optional(),
  rake: z.number().min(0).max(100),
  maxPlayers: z.number().positive('El máximo de jugadores debe ser positivo'),
  minPlayers: z.number().positive('El mínimo de jugadores debe ser positivo'),
  startTime: z.string(),
  initialStack: z.number().positive('El stack inicial debe ser positivo'),
  rebuy: z.number().optional(),
  rebuyChips: z.number().optional(),
  doubleRebuy: z.boolean(),
  doubleRebuyPrice: z.number().optional(),
  doubleRebuyChips: z.number().optional(),
  pauseLevel: z.number().optional(),
  blindStructure: z.array(z.object({
    level: z.number(),
    smallBlind: z.number(),
    bigBlind: z.number(),
    ante: z.number(),
    duration: z.number(),
    isPause: z.boolean()
  })),
  prizes: z.array(z.object({
    position: z.number(),
    percentage: z.number()
  })),
  bonuses: z.array(z.object({
    name: z.string(),
    chips: z.number(),
    price: z.number(),
    availableInBuyIn: z.boolean(),
    availableInRebuy: z.boolean(),
    description: z.string().optional()
  }))
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Agregar timeout para evitar requests muy largos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 segundos timeout
    
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            transactions: true,
            playerPayments: true
          }
        },
        blindStructure: {
          orderBy: { level: 'asc' }
        },
        prizes: {
          orderBy: { position: 'asc' }
        },
        bonuses: true,
        transactions: {
          include: {
            player: {
              select: {
                name: true
              }
            },
            user: {
              select: {
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    clearTimeout(timeoutId)

    if (!tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(tournament)
  } catch (error) {
    console.error('Error obteniendo torneo:', error)
    
    // Manejar errores específicos de Prisma
    if (error instanceof Error && error.message.includes('P2024')) {
      return NextResponse.json(
        { error: 'Error de conexión a la base de datos. Intente nuevamente.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const data = updateTournamentSchema.parse(body)

    // Verificar que el torneo existe
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        players: true
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el torneo se puede editar
    if (tournament.status !== 'REGISTERING') {
      return NextResponse.json(
        { error: 'Solo se pueden editar torneos en estado de registro' },
        { status: 400 }
      )
    }

    if (tournament.players.length > 0) {
      return NextResponse.json(
        { error: 'No se puede editar un torneo que ya tiene jugadores registrados' },
        { status: 400 }
      )
    }

    // Verificar permisos
    if (tournament.organizerId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este torneo' },
        { status: 403 }
      )
    }

    // Actualizar el torneo
    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        buyIn: data.buyIn,
        doubleBuyIn: data.doubleBuyIn,
        doubleBuyInPrice: data.doubleBuyInPrice || 0,
        doubleBuyInChips: data.doubleBuyInChips || 0,
        addOn: data.addOn || 0,
        addOnChips: data.addOnChips || 0,
        rake: data.rake,
        maxPlayers: data.maxPlayers,
        minPlayers: data.minPlayers,
        startTime: new Date(data.startTime),
        initialStack: data.initialStack,
        rebuy: data.rebuy || 0,
        rebuyChips: data.rebuyChips || 0,
        doubleRebuy: data.doubleRebuy,
        doubleRebuyPrice: data.doubleRebuyPrice || 0,
        doubleRebuyChips: data.doubleRebuyChips || 0,
        pauseLevel: data.pauseLevel || 0,
        blindStructure: {
          deleteMany: {},
          create: data.blindStructure.map(blind => ({
            level: blind.level,
            smallBlind: blind.smallBlind,
            bigBlind: blind.bigBlind,
            ante: blind.ante,
            duration: blind.duration,
            isPause: blind.isPause
          }))
        },
        prizes: {
          deleteMany: {},
          create: data.prizes.map(prize => ({
            position: prize.position,
            percentage: prize.percentage,
            amount: 0 // Se calculará automáticamente
          }))
        },
        bonuses: {
          deleteMany: {},
          create: data.bonuses.map(bonus => ({
            name: bonus.name,
            chips: bonus.chips,
            price: bonus.price,
            availableInBuyIn: bonus.availableInBuyIn,
            availableInRebuy: bonus.availableInRebuy,
            description: bonus.description || ''
          }))
        }
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        players: {
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
        },
        prizes: true,
        bonuses: true
      }
    })

    return NextResponse.json(updatedTournament)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating tournament:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Verificar que el torneo existe
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        organizerId: true,
        status: true
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos - solo organizadores pueden eliminar
    if (tournament.organizerId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Solo el organizador del torneo puede eliminarlo' },
        { status: 403 }
      )
    }

    // Verificar confirmación del nombre
    const body = await request.json()
    const { tournamentName } = body

    if (!tournamentName || tournamentName !== tournament.name) {
      return NextResponse.json(
        { error: 'El nombre del torneo no coincide. Por favor, escribe exactamente: ' + tournament.name },
        { status: 400 }
      )
    }

    // Eliminar torneo y todos sus datos relacionados
    await prisma.$transaction([
      // Eliminar logs de auditoría
      prisma.auditLog.deleteMany({
        where: { tournamentId: id }
      }),
      // Eliminar snapshots
      prisma.tournamentSnapshot.deleteMany({
        where: { tournamentId: id }
      }),
      // Eliminar pagos de jugadores
      prisma.playerPayment.deleteMany({
        where: { tournamentId: id }
      }),
      // Eliminar transacciones
      prisma.transaction.deleteMany({
        where: { tournamentId: id }
      }),
      // Eliminar bonos asignados
      prisma.playerBonus.deleteMany({
        where: {
          player: {
            tournamentId: id
          }
        }
      }),
      // Eliminar bonos del torneo
      prisma.bonus.deleteMany({
        where: { tournamentId: id }
      }),
      // Eliminar premios
      prisma.prize.deleteMany({
        where: { tournamentId: id }
      }),
      // Eliminar estructura de blinds
      prisma.blindStructure.deleteMany({
        where: { tournamentId: id }
      }),
      // Eliminar jugadores
      prisma.player.deleteMany({
        where: { tournamentId: id }
      }),
      // Eliminar el torneo
      prisma.tournament.delete({
        where: { id }
      })
    ])

    console.log(`🗑️ Torneo eliminado: ${tournament.name} (${id}) por usuario ${decoded.userId}`)

    return NextResponse.json({ 
      message: 'Torneo eliminado exitosamente',
      tournamentName: tournament.name
    })
  } catch (error) {
    console.error('Error eliminando torneo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 