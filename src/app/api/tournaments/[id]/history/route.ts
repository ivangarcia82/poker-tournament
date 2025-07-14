import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(
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
        organizerId: true
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos
    if (tournament.organizerId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado para ver este historial' },
        { status: 403 }
      )
    }

    // Obtener logs de auditoría del torneo
    const logs = await prisma.auditLog.findMany({
      where: {
        tournamentId: id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limitar a los últimos 100 logs
    })

    // Obtener información de jugadores para los logs que la necesiten
    const playerIds = logs.filter(log => log.playerId).map(log => log.playerId!)
    const players = playerIds.length > 0 ? await prisma.player.findMany({
      where: {
        id: { in: playerIds }
      },
      select: {
        id: true,
        name: true
      }
    }) : []

    const playersMap = new Map(players.map(p => [p.id, p]))

    // Transformar los logs para el frontend
    const transformedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      details: log.details || '',
      createdAt: log.createdAt.toISOString(),
      user: {
        name: log.user.name,
        email: log.user.email
      },
      playerId: log.playerId,
      player: log.playerId ? {
        name: playersMap.get(log.playerId)?.name || 'Jugador desconocido'
      } : undefined
    }))

    return NextResponse.json(transformedLogs)
  } catch (error) {
    console.error('Error obteniendo historial:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 