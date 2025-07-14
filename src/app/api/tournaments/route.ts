import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { calculatePrizes } from '@/lib/tournament-utils'
import { z } from 'zod'

const createTournamentSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  buyIn: z.number().positive('El buy-in debe ser positivo'),
  doubleBuyIn: z.boolean().default(false),
  doubleBuyInPrice: z.number().positive('El precio del buy-in doble debe ser positivo').optional(),
  doubleBuyInChips: z.number().positive('Las fichas del buy-in doble deben ser positivas').optional(),
  addOn: z.number().positive('El add-on debe ser positivo').optional(),
  addOnChips: z.number().positive('Las fichas del add-on deben ser positivas').optional(),
  rake: z.number().min(0).max(100, 'El rake debe estar entre 0 y 100'),
  maxPlayers: z.number().positive('El máximo de jugadores debe ser positivo'),
  minPlayers: z.number().positive('El mínimo de jugadores debe ser positivo'),
  startTime: z.string().min(1, 'La fecha de inicio es requerida'),
  initialStack: z.number().positive('El stack inicial debe ser positivo'),
  rebuy: z.number().positive('El rebuy debe ser positivo').optional(),
  rebuyChips: z.number().positive('Las fichas de rebuy deben ser positivas').optional(),
  doubleRebuy: z.boolean().default(false),
  doubleRebuyPrice: z.number().positive('El precio de rebuy doble debe ser positivo').optional(),
  doubleRebuyChips: z.number().positive('Las fichas de rebuy doble deben ser positivas').optional(),
  bonuses: z.array(z.object({
    name: z.string().min(1, 'El nombre del bono es requerido'),
    chips: z.number().positive('Las fichas deben ser positivas'),
    price: z.number().min(0, 'El precio no puede ser negativo'),
    availableInBuyIn: z.boolean().default(true),
    availableInRebuy: z.boolean().default(false),
    description: z.string().optional()
  })).optional().default([]),
  blindStructure: z.array(z.object({
    level: z.number().positive(),
    smallBlind: z.number().positive(),
    bigBlind: z.number().positive(),
    ante: z.number().min(0),
    duration: z.number().positive(),
    isPause: z.boolean().default(false)
  }))
})

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const organizerId = searchParams.get('organizerId')

    const where: any = {}
    
    // Filtrar por estado si se especifica
    if (status) where.status = status
    
    // Filtrar por organizador - solo mostrar torneos del usuario actual o todos si es admin/staff
    if (decoded.role === 'ADMIN' || decoded.role === 'STAFF') {
      if (organizerId) where.organizerId = organizerId
    } else {
      where.organizerId = decoded.userId
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        players: {
          select: {
            id: true,
            name: true,
            chips: true,
            isEliminated: true
          }
        },
        blindStructure: true,
        prizes: true,
        bonuses: true,
        _count: {
          select: {
            players: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tournaments)
  } catch (error) {
    console.error('Error obteniendo torneos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    console.log('User ID:', decoded.userId)
    console.log('User Role:', decoded.role)

    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))

    // Preprocesar datos para manejar valores undefined, null, strings vacíos y NaN
    const processedBody = {
      ...body,
      doubleRebuyPrice: (() => {
        const value = body.doubleRebuyPrice;
        if (value === undefined || value === null || value === '' || isNaN(Number(value))) {
          return undefined;
        }
        const numValue = Number(value);
        return isNaN(numValue) ? undefined : numValue;
      })(),
      doubleRebuyChips: (() => {
        const value = body.doubleRebuyChips;
        if (value === undefined || value === null || value === '' || isNaN(Number(value))) {
          return undefined;
        }
        const numValue = Number(value);
        return isNaN(numValue) ? undefined : numValue;
      })(),
      doubleBuyInPrice: (() => {
        const value = body.doubleBuyInPrice;
        if (value === undefined || value === null || value === '' || isNaN(Number(value))) {
          return undefined;
        }
        const numValue = Number(value);
        return isNaN(numValue) ? undefined : numValue;
      })(),
      doubleBuyInChips: (() => {
        const value = body.doubleBuyInChips;
        if (value === undefined || value === null || value === '' || isNaN(Number(value))) {
          return undefined;
        }
        const numValue = Number(value);
        return isNaN(numValue) ? undefined : numValue;
      })(),
      addOnChips: (() => {
        const value = body.addOnChips;
        if (value === undefined || value === null || value === '' || isNaN(Number(value))) {
          return undefined;
        }
        const numValue = Number(value);
        return isNaN(numValue) ? undefined : numValue;
      })()
    }
    console.log('Processed body:', JSON.stringify(processedBody, null, 2))

    const data = createTournamentSchema.parse(processedBody)
    console.log('Validated data:', JSON.stringify(data, null, 2))
    console.log('doubleRebuy:', data.doubleRebuy)
    console.log('doubleRebuyPrice:', data.doubleRebuyPrice)
    console.log('doubleRebuyChips:', data.doubleRebuyChips)
    
    // Limpiar campos de doble recompra si no está activada
    const tournamentData: any = {
      name: data.name,
      description: data.description,
      buyIn: data.buyIn,
      doubleBuyIn: data.doubleBuyIn,
      addOn: data.addOn,
      addOnChips: data.addOnChips,
      rake: data.rake,
      maxPlayers: data.maxPlayers,
      minPlayers: data.minPlayers,
      startTime: new Date(data.startTime),
      initialStack: data.initialStack,
      rebuy: data.rebuy,
      rebuyChips: data.rebuyChips,
      doubleRebuy: data.doubleRebuy,
      organizerId: decoded.userId,
      blindStructure: {
        create: data.blindStructure
      },
      bonuses: {
        create: data.bonuses || []
      }
    }
    
    // Solo incluir campos de buy-in doble si está habilitado y los valores están presentes
    if (data.doubleBuyIn && typeof data.doubleBuyInPrice === 'number' && typeof data.doubleBuyInChips === 'number') {
      console.log('Incluyendo campos de buy-in doble')
      tournamentData.doubleBuyInPrice = data.doubleBuyInPrice
      tournamentData.doubleBuyInChips = data.doubleBuyInChips
    } else {
      console.log('Limpiando campos de buy-in doble')
      tournamentData.doubleBuyInPrice = null
      tournamentData.doubleBuyInChips = null
    }
    
    // Solo incluir campos de doble recompra si está habilitada y los valores están presentes
    if (data.doubleRebuy && typeof data.doubleRebuyPrice === 'number' && typeof data.doubleRebuyChips === 'number') {
      console.log('Incluyendo campos de doble recompra')
      tournamentData.doubleRebuyPrice = data.doubleRebuyPrice
      tournamentData.doubleRebuyChips = data.doubleRebuyChips
    } else {
      console.log('Limpiando campos de doble recompra')
      tournamentData.doubleRebuyPrice = null
      tournamentData.doubleRebuyChips = null
    }
    
    console.log('Tournament data to save:', JSON.stringify(tournamentData, null, 2))
    // Crear torneo
    const tournament = await prisma.tournament.create({
      data: tournamentData,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        blindStructure: true,
        bonuses: true
      }
    })

    return NextResponse.json({
      message: 'Torneo creado exitosamente',
      tournament
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creando torneo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 