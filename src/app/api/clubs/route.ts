import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'ORGANIZER')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, logoUrl, colorPrimary, colorSecondary, colorAccent } = body
    
    // Validar campos obligatorios
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'El nombre del club es obligatorio' }, { status: 400 })
    }
    
    // Crear el club
    const club = await prisma.club.create({
      data: {
        name: name.trim(),
        logoUrl: logoUrl || null,
        colorPrimary: colorPrimary || '#2563eb',
        colorSecondary: colorSecondary || '#f3f4f6',
        colorAccent: colorAccent || '#22c55e'
      }
    })
    
    // Verificar que el usuario existe antes de actualizarlo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, clubId: true }
    })

    if (!user) {
      console.error(`Usuario no encontrado: ${decoded.userId}`)
      return NextResponse.json({ 
        error: 'Usuario no encontrado en la base de datos',
        details: `userId: ${decoded.userId}, email: ${decoded.email}`
      }, { status: 404 })
    }

    // Verificar si el usuario ya tiene un club
    if (user.clubId) {
      console.log(`Usuario ${user.email} ya tiene un club asignado: ${user.clubId}`)
      return NextResponse.json({ 
        error: 'El usuario ya tiene un club asignado',
        details: 'No se puede crear más de un club por usuario'
      }, { status: 400 })
    }

    console.log(`Asociando club ${club.id} al usuario ${user.email} (${user.id})`)
    
    // Asociar el club al usuario que lo creó
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { clubId: club.id }
    })
    
    return NextResponse.json({
      message: 'Club creado exitosamente',
      club
    })
  } catch (error) {
    console.error('Error creando club:', error)
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Error interno del servidor', details }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener el club del usuario
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { club: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (!user.club) {
      return NextResponse.json({ error: 'Usuario no asociado a ningún club' }, { status: 404 })
    }

    return NextResponse.json(user.club)
  } catch (error) {
    console.error('Error obteniendo club:', error)
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Error interno del servidor', details }, { status: 500 })
  }
} 