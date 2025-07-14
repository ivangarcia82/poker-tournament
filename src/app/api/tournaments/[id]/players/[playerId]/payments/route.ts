import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; playerId: string }> }) {
  try {
    const { id: tournamentId, playerId } = await params
    const payments = await prisma.playerPayment.findMany({
      where: { tournamentId, playerId },
      orderBy: { paidAt: 'desc' }
    })
    return NextResponse.json(payments)
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Error interno del servidor', details }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; playerId: string }> }) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'ORGANIZER' && decoded.role !== 'STAFF')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    const { id: tournamentId, playerId } = await params
    const { amount, method, reference, notes } = await request.json()
    if (!amount || !method) return NextResponse.json({ error: 'Monto y método son obligatorios' }, { status: 400 })
    const payment = await prisma.playerPayment.create({
      data: { playerId, tournamentId, amount, method, reference, notes }
    })
    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error en PlayerPayment POST:', error)
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Error interno del servidor', details }, { status: 500 })
  }
} 