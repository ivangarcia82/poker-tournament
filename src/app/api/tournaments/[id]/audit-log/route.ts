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
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    // Solo organizador, staff o admin pueden ver el historial
    const tournament = await prisma.tournament.findUnique({ where: { id } })
    if (!tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }
    if (tournament.organizerId !== decoded.userId && decoded.role !== 'ADMIN' && decoded.role !== 'STAFF') {
      return NextResponse.json({ error: 'No autorizado para ver el historial' }, { status: 403 })
    }
    const logs = await prisma.auditLog.findMany({
      where: { tournamentId: id },
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error obteniendo historial:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 