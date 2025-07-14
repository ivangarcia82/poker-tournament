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

    // Obtener jugadores
    const players = await prisma.player.findMany({
      where: {
        tournamentId: id
      }
    })

    // Obtener pagos por separado
    const payments = await prisma.playerPayment.findMany({
      where: {
        player: {
          tournamentId: id
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calcular resumen por jugador
    const debtSummary = players.map(player => {
      const playerPayments = payments.filter(p => p.playerId === player.id)
      const totalPaid = playerPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
      const remainingDebt = (player as any).deuda - totalPaid
      const lastPayment = playerPayments[0]

      return {
        playerId: player.id,
        playerName: player.name,
        totalDebt: (player as any).deuda || 0,
        totalPaid: totalPaid,
        remainingDebt: Math.max(0, remainingDebt), // No puede ser negativo
        lastPaymentDate: lastPayment ? lastPayment.createdAt.toISOString() : undefined,
        paymentCount: playerPayments.length
      }
    })

    return NextResponse.json(debtSummary)
  } catch (error) {
    console.error('Error obteniendo resumen de pagos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 