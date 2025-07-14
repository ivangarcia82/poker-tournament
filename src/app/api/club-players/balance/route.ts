import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'ORGANIZER' && decoded.role !== 'STAFF')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    // Obtener todos los clubPlayers
    const clubPlayers = await prisma.clubPlayer.findMany({
      include: {
        players: {
          include: {
            transactions: true,
            playerPayments: true,
            tournament: true
          }
        }
      }
    })
    // Calcular balance para cada clubPlayer
    const result = clubPlayers.map(cp => {
      let deuda = 0
      let pagado = 0
      cp.players.forEach(player => {
        // Deuda: buy-in + recompras + dobles + add-ons + bonos
        const t = player.tournament
        if (!t) return
        deuda += t.buyIn || 0
        deuda += (t.rebuy || 0) * player.transactions.filter(tx => tx.type === 'REBUY' && (!tx.description || tx.description.includes('sencilla'))).length
        deuda += (t.doubleRebuyPrice || 0) * player.transactions.filter(tx => tx.type === 'REBUY' && tx.description && tx.description.includes('doble')).length
        deuda += (t.addOn || 0) * player.transactions.filter(tx => tx.type === 'ADD_ON').length
        deuda += player.transactions.filter(tx => tx.type === 'OTHER' && tx.description && tx.description.startsWith('Bono:')).reduce((sum, tx) => sum + tx.amount, 0)
        // Pagos
        pagado += player.playerPayments.reduce((sum, p) => sum + p.amount, 0)
      })
      return {
        id: cp.id,
        name: cp.name,
        email: cp.email,
        phone: cp.phone,
        notes: cp.notes,
        deuda,
        pagado,
        balance: deuda - pagado
      }
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en balance de clubPlayers:', error)
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Error interno del servidor', details }, { status: 500 })
  }
} 