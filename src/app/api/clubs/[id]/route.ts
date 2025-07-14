import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'ORGANIZER')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    const { id } = await params
    const body = await request.json()
    const { name, logoUrl, colorPrimary, colorSecondary, colorAccent } = body
    
    // Validar que el nombre no esté vacío
    if (name && !name.trim()) {
      return NextResponse.json({ error: 'El nombre del club es obligatorio' }, { status: 400 })
    }
    
    const updated = await prisma.club.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(colorPrimary && { colorPrimary }),
        ...(colorSecondary && { colorSecondary }),
        ...(colorAccent && { colorAccent })
      }
    })
    return NextResponse.json(updated)
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Error interno del servidor', details }, { status: 500 })
  }
} 