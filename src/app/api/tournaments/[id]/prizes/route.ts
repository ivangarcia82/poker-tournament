import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function PUT(
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
    const body = await request.json()
    const { prizes } = body
    if (!Array.isArray(prizes) || prizes.length === 0) {
      return NextResponse.json({ error: 'Premios inválidos' }, { status: 400 })
    }
    // Verificar que el torneo existe y permisos
    const tournament = await prisma.tournament.findUnique({ where: { id } })
    if (!tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }
    if (tournament.organizerId !== decoded.userId && decoded.role !== 'ADMIN' && decoded.role !== 'STAFF') {
      return NextResponse.json({ error: 'No autorizado para modificar este torneo' }, { status: 403 })
    }
    // Eliminar premios anteriores
    await prisma.prize.deleteMany({ where: { tournamentId: id } })
    // Crear nuevos premios
    const created = await prisma.prize.createMany({
      data: prizes.map((p: any) => ({
        position: p.position,
        percentage: p.percentage,
        amount: 0, // El monto se calcula en frontend
        tournamentId: id
      }))
    })
    // Registrar en AuditLog
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'UPDATE_PRIZES',
        details: `Actualizó la estructura de premios (${prizes.length} posiciones)` ,
        tournamentId: id
      }
    })
    return NextResponse.json({ message: 'Premios actualizados', count: created.count })
  } catch (error) {
    console.error('Error actualizando premios:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 