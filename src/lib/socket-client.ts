import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

// Instancia global del socket
let socket: Socket | null = null

// Función para obtener la instancia del socket
export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })
  }
  return socket
}

// Hook para usar Socket.io en componentes
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = getSocket()
    socketRef.current = socket

    const onConnect = () => {
      console.log('🔌 Conectado al servidor Socket.io')
      setIsConnected(true)
    }

    const onDisconnect = () => {
      console.log('🔌 Desconectado del servidor Socket.io')
      setIsConnected(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    // Si ya está conectado, establecer el estado
    if (socket.connected) {
      setIsConnected(true)
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  return {
    socket: socketRef.current,
    isConnected
  }
}

// Hook para unirse a un torneo específico
export function useTournamentSocket(tournamentId: string) {
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    if (socket && isConnected && tournamentId) {
      console.log(`🔌 Uniéndose al torneo ${tournamentId}`)
      socket.emit('join-tournament', tournamentId)
      
      return () => {
        console.log(`🔌 Saliendo del torneo ${tournamentId}`)
        socket.emit('leave-tournament', tournamentId)
      }
    }
  }, [socket, isConnected, tournamentId])

  return { socket, isConnected }
}

// Hook para escuchar eventos específicos del torneo
type EventData = {
  tournamentId?: string
  currentLevel?: number
  timeRemaining?: number
  isPaused?: boolean
  status?: string
  [key: string]: unknown
}

export function useTournamentEvents(tournamentId: string, events: Record<string, (data: EventData) => void>) {
  const { socket, isConnected } = useTournamentSocket(tournamentId)

  useEffect(() => {
    if (!socket || !isConnected) return

    // Registrar todos los eventos
    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler)
    })

    // Limpiar eventos al desmontar
    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler)
      })
    }
  }, [socket, isConnected, events])

  return { socket, isConnected }
}

// Hook específico para el reloj del torneo
export function useTournamentClock(tournamentId: string, onClockUpdate: (data: EventData) => void) {
  return useTournamentEvents(tournamentId, {
    'tournament:clock:update': onClockUpdate,
    'tournament:level:change': onClockUpdate,
    'tournament:pause': onClockUpdate,
    'tournament:player:eliminated': onClockUpdate,
    'tournament:player:reactivated': onClockUpdate
  })
}

// Hook para eventos de jugadores
export function useTournamentPlayers(tournamentId: string, onPlayerUpdate: (data: EventData) => void) {
  return useTournamentEvents(tournamentId, {
    'tournament:player:added': onPlayerUpdate,
    'tournament:player:updated': onPlayerUpdate,
    'tournament:player:eliminated': onPlayerUpdate,
    'tournament:transaction:added': onPlayerUpdate,
    'tournament:payment:added': onPlayerUpdate,
    'tournament:bonus:assigned': onPlayerUpdate
  })
}

// Función para desconectar el socket (útil para limpieza)
export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
} 