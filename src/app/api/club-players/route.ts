import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    console.log('TOKEN:', token)
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const decoded = verifyToken(token)
    console.log('DECODED:', decoded)
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'ORGANIZER' && decoded.role !== 'STAFF')) {
      return NextResponse.json({ error: 'No autorizado', debug: decoded }, { status: 403 })
    }

    // Obtener el usuario actual para verificar su club
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { clubId: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.toLowerCase() || ''

    // Construir el filtro de búsqueda
    const where: any = {
      OR: [
        { name: { contains: q } },
        { email: { contains: q } }
      ]
    }

    // Si el usuario no es ADMIN, filtrar por su club
    if (user.role !== 'ADMIN') {
      if (!user.clubId) {
        return NextResponse.json({ error: 'Usuario no asociado a ningún club' }, { status: 403 })
      }
      where.clubId = user.clubId
    }

    const players = await prisma.clubPlayer.findMany({
      where,
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(players)
  } catch (error) {
    console.error('Error en ClubPlayers endpoint:', error)
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Error interno del servidor', details }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    console.log('POST - TOKEN:', token)
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const decoded = verifyToken(token)
    console.log('POST - DECODED:', decoded)
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'ORGANIZER' && decoded.role !== 'STAFF')) {
      return NextResponse.json({ error: 'No autorizado', debug: decoded }, { status: 403 })
    }

    // Obtener el usuario actual para verificar su club
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { clubId: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Si el usuario no es ADMIN, verificar que tenga un club
    if (user.role !== 'ADMIN' && !user.clubId) {
      return NextResponse.json({ error: 'Usuario no asociado a ningún club' }, { status: 403 })
    }
    
    const body = await request.json()
    const { name, email, phone, notes } = body
    
    // Validar campos obligatorios
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }
    
    // Si se proporciona email, verificar que no exista en el mismo club
    if (email && email.trim() !== '') {
      const whereClause: any = { 
        email: email.trim()
      }
      
      if (user.role !== 'ADMIN' && user.clubId) {
        whereClause.clubId = user.clubId
      }
      
      const existingPlayer = await prisma.clubPlayer.findFirst({
        where: whereClause
      })
      
      if (existingPlayer) {
        return NextResponse.json({ 
          error: 'Ya existe un jugador con este email en tu club',
          details: 'El email debe ser único por club'
        }, { status: 400 })
      }
    }
    
    // Crear el jugador con datos limpios
    const player = await prisma.clubPlayer.create({
      data: { 
        name: name.trim(),
        email: email && email.trim() !== '' ? email.trim() : null,
        phone: phone && phone.trim() !== '' ? phone.trim() : null,
        notes: notes && notes.trim() !== '' ? notes.trim() : null,
        clubId: user.role === 'ADMIN' ? (body.clubId || user.clubId) : user.clubId
      }
    })
    
    return NextResponse.json(player)
  } catch (error) {
    console.error('Error en ClubPlayers endpoint:', error)
    
    // Manejar errores específicos de Prisma
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Ya existe un jugador con este email en tu club',
        details: 'El email debe ser único por club'
      }, { status: 400 })
    }
    
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Error interno del servidor', details }, { status: 500 })
  }
} 