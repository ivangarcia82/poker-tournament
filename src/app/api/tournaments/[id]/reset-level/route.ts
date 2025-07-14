import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

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

    // Verificar que el torneo existe
    const tournament = await prisma.tournament.findUnique({
      where: { id: id }
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
        { error: 'No autorizado para modificar este torneo' },
        { status: 403 }
      )
    }

    // Solo permitir reiniciar si el torneo está en curso
    if (tournament.status !== 'RUNNING' && tournament.status !== 'PAUSED') {
      return NextResponse.json(
        { error: 'Solo se puede reiniciar el nivel en torneos en curso o pausados' },
        { status: 400 }
      )
    }

    // Reiniciar el nivel actual
    const updatedTournament = await prisma.tournament.update({
      where: { id: id },
      data: {
        pauseLevel: 0, // Reiniciar al nivel 1
        pausedAt: null,
        pausedTimeRemaining: null
      },
      include: {
        organizer: true,
        players: true,
        blindStructure: true,
        prizes: true
      }
    })

    return NextResponse.json({
      message: 'Nivel reiniciado exitosamente',
      tournament: updatedTournament
    })
  } catch (error) {
    console.error('Error reiniciando nivel:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 