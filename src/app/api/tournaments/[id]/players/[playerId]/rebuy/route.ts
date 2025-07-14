import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

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
    const { type } = body // 'single' | 'double'
    if (!['single', 'double'].includes(type)) {
      return NextResponse.json({ error: 'Tipo de recompra inválido' }, { status: 400 })
    }
    // Obtener torneo y jugador
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } })
    if (!tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }
    if (tournament.status !== 'RUNNING' && tournament.status !== 'REGISTERING' && tournament.status !== 'PAUSED') {
      return NextResponse.json({ error: 'Solo se puede hacer recompra en torneos en curso, registro o pausa' }, { status: 400 })
    }
    if (tournament.organizerId !== decoded.userId && decoded.role !== 'ADMIN' && decoded.role !== 'STAFF') {
      return NextResponse.json({ error: 'No autorizado para modificar este torneo' }, { status: 403 })
    }
    const player = await prisma.player.findUnique({ where: { id: playerId } })
    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }
    
    // Verificar acceso a recompra doble si se solicita
    if (type === 'double' && !player.hasDoubleRebuyAccess) {
      return NextResponse.json({ error: 'El jugador no tiene acceso a recompras dobles' }, { status: 400 })
    }
    // Determinar cantidad y precio
    let chips = 0, price = 0, description = ''
    if (type === 'single') {
      chips = tournament.rebuyChips || 0
      price = tournament.rebuy || 0
      description = 'Recompra sencilla'
    } else {
      chips = tournament.doubleRebuyChips || 0
      price = tournament.doubleRebuyPrice || 0
      description = 'Recompra doble'
    }
    if (!chips || !price) {
      return NextResponse.json({ error: 'Configuración de recompra inválida' }, { status: 400 })
    }
    // Registrar transacción y sumar fichas
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: 'REBUY',
          amount: price,
          description,
          tournamentId,
          playerId,
          userId: decoded.userId
        }
      }),
      prisma.player.update({
        where: { id: playerId },
        data: { chips: { increment: chips } }
      }),
      prisma.auditLog.create({
        data: {
          userId: decoded.userId,
          action: `REBUY_${type.toUpperCase()}`,
          details: `${description} de ${chips} fichas por $${price}`,
          tournamentId,
          playerId
        }
      })
    ])
    return NextResponse.json({ message: 'Recompra aplicada', chips, price })
  } catch (error) {
    console.error('Error aplicando recompra:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 