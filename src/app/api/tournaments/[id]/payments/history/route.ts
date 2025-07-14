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
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'ORGANIZER' && decoded.role !== 'STAFF')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener todos los pagos del torneo con información del jugador
    const payments = await prisma.playerPayment.findMany({
      where: {
        player: {
          tournamentId: id
        }
      },
      include: {
        player: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formatear la respuesta
    const paymentHistory = payments.map(payment => ({
      id: payment.id,
      playerId: payment.playerId,
      playerName: payment.player.name,
      amount: payment.amount,
      method: payment.method,
      description: payment.notes || payment.reference || 'Pago registrado',
      createdAt: payment.createdAt.toISOString()
    }))

    return NextResponse.json(paymentHistory)
  } catch (error) {
    console.error('Error obteniendo historial de pagos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 