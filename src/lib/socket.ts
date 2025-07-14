import { Server as SocketIOServer } from 'socket.io'
import { Server as NetServer } from 'http'

// Tipos para los eventos de Socket.io
export interface TournamentEvents {
  // Eventos del reloj
  'tournament:clock:update': (data: {
    tournamentId: string
    currentLevel: number
    timeRemaining: number
    status: string
    isPaused: boolean
  }) => void
  
  'tournament:level:change': (data: {
    tournamentId: string
    newLevel: number
    smallBlind: number
    bigBlind: number
    ante: number
  }) => void
  
  'tournament:pause': (data: {
    tournamentId: string
    isPaused: boolean
    timeRemaining: number
  }) => void
  
  // Eventos de jugadores
  'tournament:player:added': (data: {
    tournamentId: string
    player: unknown
  }) => void
  
  'tournament:player:updated': (data: {
    tournamentId: string
    playerId: string
    updates: unknown
  }) => void
  
  'tournament:player:eliminated': (data: {
    tournamentId: string
    playerId: string
    playerName: string
    eliminatedAt: Date
  }) => void
  
  'tournament:player:reactivated': (data: {
    tournamentId: string
    playerId: string
    playerName: string
  }) => void
  
  // Eventos de transacciones
  'tournament:transaction:added': (data: {
    tournamentId: string
    playerId: string
    transaction: unknown
  }) => void
  
  // Eventos de pagos
  'tournament:payment:added': (data: {
    tournamentId: string
    playerId: string
    payment: unknown
  }) => void
  
  // Eventos de bonos
  'tournament:bonus:assigned': (data: {
    tournamentId: string
    playerId: string
    bonus: unknown
  }) => void
  
  // Eventos de estado del torneo
  'tournament:status:changed': (data: {
    tournamentId: string
    status: string
    endTime?: string
  }) => void
}

// Configuración del servidor Socket.io
export function configureSocketServer(server: NetServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  })

  // Manejo de conexiones
  io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id)

    // Unirse a un torneo específico
    socket.on('join:tournament', (tournamentId: string) => {
      socket.join(`tournament:${tournamentId}`)
      console.log(`👥 Cliente ${socket.id} se unió al torneo ${tournamentId}`)
    })

    // Salir de un torneo
    socket.on('leave:tournament', (tournamentId: string) => {
      socket.leave(`tournament:${tournamentId}`)
      console.log(`👋 Cliente ${socket.id} salió del torneo ${tournamentId}`)
    })

    // Desconexión
    socket.on('disconnect', () => {
      console.log('🔌 Cliente desconectado:', socket.id)
    })
  })

  return io
}

// Función para emitir eventos a todos los clientes de un torneo
export function emitToTournament(io: SocketIOServer, tournamentId: string, event: keyof TournamentEvents, data: unknown) {
  io.to(`tournament:${tournamentId}`).emit(event, data)
  console.log(`📡 Emitido evento ${event} al torneo ${tournamentId}:`, data)
}

// Función para emitir eventos a todos los clientes
export function emitToAll(io: SocketIOServer, event: keyof TournamentEvents, data: unknown) {
  io.emit(event, data)
  console.log(`📡 Emitido evento ${event} a todos los clientes:`, data)
}

// Exportar para CommonJS (necesario para server.js)
module.exports = {
  configureSocketServer,
  emitToTournament,
  emitToAll
} 