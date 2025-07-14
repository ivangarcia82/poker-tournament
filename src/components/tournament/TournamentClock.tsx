'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Tournament, BlindStructure } from '@/types'
import { useTournamentClock } from '@/lib/socket-client'

interface TournamentClockProps {
  tournament: Tournament
  onUpdate: () => void
}

export default function TournamentClock({ tournament, onUpdate }: TournamentClockProps) {
  const [currentLevel, setCurrentLevel] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [loading, setLoading] = useState(false)

  // Referencias para el temporizador
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Usar Socket.io para recibir actualizaciones en tiempo real
  const { socket, isConnected } = useTournamentClock(tournament.id, (data) => {
    console.log('📡 Recibida actualización del reloj:', data)
    
    if (data.tournamentId === tournament.id) {
      if (data.currentLevel !== undefined) {
        setCurrentLevel(data.currentLevel)
        const newLevel = data.currentLevel
        const levelDuration = tournament.blindStructure[newLevel]?.duration * 60 || 0
        setTimeRemaining(data.timeRemaining !== undefined ? data.timeRemaining : levelDuration)
      }
      if (data.timeRemaining !== undefined) setTimeRemaining(data.timeRemaining)
      if (data.isPaused !== undefined) setIsPaused(data.isPaused)
      if (data.status !== undefined) setIsRunning(data.status === 'RUNNING')
      
      onUpdate()
    }
  })

  // Cargar estado inicial del torneo
  useEffect(() => {
    const loadTournamentState = async () => {
      try {
        const response = await fetch(`/api/tournaments/${tournament.id}/status`)
        if (response.ok) {
          const data = await response.json()
          setCurrentLevel(data.currentLevel || 0)
          setTimeRemaining(data.timeRemaining || 0)
          setIsPaused(data.isPaused || false)
          setIsRunning(data.status === 'RUNNING')
        }
      } catch (error) {
        console.error('Error cargando estado del torneo:', error)
      }
    }

    loadTournamentState()
  }, [tournament.id])

  // Sistema de temporizador automático
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (isRunning && !isPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1
          
          if (newTime <= 0) {
            const nextLevel = currentLevel + 1
            if (nextLevel < tournament.blindStructure.length) {
              handleAutoNextLevel(nextLevel)
              return tournament.blindStructure[nextLevel]?.duration * 60 || 0
            } else {
              setIsRunning(false)
              return 0
            }
          }
          
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning, isPaused, timeRemaining, currentLevel, tournament.blindStructure])

  const handleAutoNextLevel = useCallback(async (nextLevel: number) => {
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentLevel: nextLevel,
          timeRemaining: tournament.blindStructure[nextLevel]?.duration * 60 || 0
        })
      })

      if (response.ok) {
        setCurrentLevel(nextLevel)
        setTimeRemaining(tournament.blindStructure[nextLevel]?.duration * 60 || 0)
        console.log(`🔄 Nivel automáticamente cambiado a ${nextLevel + 1}`)
      }
    } catch (error) {
      console.error('Error cambiando nivel automáticamente:', error)
    }
  }, [tournament.id, tournament.blindStructure])

  const updateClock = async (data: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const updatedData = await response.json()
        setCurrentLevel(updatedData.currentLevel || 0)
        setTimeRemaining(updatedData.timeRemaining || 0)
        setIsPaused(updatedData.isPaused || false)
        setIsRunning(updatedData.status === 'RUNNING')
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating clock:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStart = () => {
    updateClock({ 
      status: 'RUNNING',
      startTime: new Date().toISOString()
    })
  }

  const handlePause = () => {
    updateClock({ 
      isPaused: true,
      timeRemaining
    })
  }

  const handleResume = () => {
    updateClock({ 
      isPaused: false
    })
  }

  const handleNextLevel = () => {
    const nextLevel = currentLevel + 1
    if (nextLevel < tournament.blindStructure.length) {
      updateClock({
        currentLevel: nextLevel,
        timeRemaining: tournament.blindStructure[nextLevel]?.duration * 60 || 0
      })
    }
  }

  const handleResetLevel = () => {
    const currentBlind = tournament.blindStructure[currentLevel]
    if (currentBlind) {
      updateClock({
        timeRemaining: currentBlind.duration * 60
      })
    }
  }

  const handlePreviousLevel = () => {
    if (currentLevel > 0) {
      const prevLevel = currentLevel - 1
      const prevBlind = tournament.blindStructure[prevLevel]
      if (prevBlind) {
        updateClock({
          currentLevel: prevLevel,
          timeRemaining: prevBlind.duration * 60
        })
      }
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const currentBlind = tournament.blindStructure[currentLevel] || tournament.blindStructure[0]
  const nextBlind = tournament.blindStructure[currentLevel + 1]

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/20">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
      
      {/* Contenido principal */}
      <div className="relative p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <span className="text-2xl">🃏</span>
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {tournament.name}
              </h1>
              <p className="text-xl text-gray-600 mt-1">
                Reloj del Torneo
              </p>
            </div>
          </div>
          
          {/* Estado de conexión WebSocket */}
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} shadow-lg`}></div>
            <span className="text-lg text-gray-600 font-medium">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        {/* Timer Principal */}
        <div className="mb-8 text-center">
          <div className="relative overflow-hidden rounded-3xl border-4 border-white shadow-2xl bg-gradient-to-br from-blue-600 to-indigo-600">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20"></div>
            <div className="relative p-8">
              <h2 className="text-3xl font-bold text-white mb-4">TIEMPO RESTANTE</h2>
              <div className="text-8xl font-bold text-white font-mono tracking-wider">
                {formatTime(timeRemaining)}
              </div>
              <p className="text-xl text-white/90 mt-4 font-medium">
                {isPaused ? '⏸️ PAUSADO' : isRunning ? '▶️ EN CURSO' : '⏹️ DETENIDO'}
              </p>
            </div>
          </div>
        </div>

        {/* Información del nivel actual y siguiente */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Nivel Actual */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-white shadow-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20"></div>
            <div className="relative p-6">
              <h3 className="text-2xl font-bold mb-2">NIVEL ACTUAL</h3>
              <div className="text-4xl font-bold mb-2">{currentLevel + 1}</div>
              <div className="text-xl space-y-1">
                <div>SB: {currentBlind?.smallBlind?.toLocaleString()}</div>
                <div>BB: {currentBlind?.bigBlind?.toLocaleString()}</div>
                {currentBlind?.ante > 0 && <div>Ante: {currentBlind.ante?.toLocaleString()}</div>}
              </div>
            </div>
          </div>
          
          {/* Próximo Nivel */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-white shadow-xl bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-gray-100/50"></div>
            <div className="relative p-6">
              <h3 className="text-2xl font-bold mb-2 text-gray-800">PRÓXIMO NIVEL</h3>
              {nextBlind ? (
                <>
                  <div className="text-4xl font-bold mb-2 text-gray-800">{currentLevel + 2}</div>
                  <div className="text-xl text-gray-700 space-y-1">
                    <div>SB: {nextBlind.smallBlind?.toLocaleString()}</div>
                    <div>BB: {nextBlind.bigBlind?.toLocaleString()}</div>
                    {nextBlind.ante > 0 && <div>Ante: {nextBlind.ante?.toLocaleString()}</div>}
                  </div>
                </>
              ) : (
                <div className="text-xl text-gray-600">Último nivel</div>
              )}
            </div>
          </div>
          
          {/* Estadísticas del Torneo */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-white shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20"></div>
            <div className="relative p-6">
              <h3 className="text-2xl font-bold mb-2">ESTADÍSTICAS</h3>
              <div className="text-xl space-y-2">
                <div>Jugadores: {tournament.players?.length || 0}</div>
                <div>Niveles: {tournament.blindStructure?.length || 0}</div>
                <div>Estado: {isRunning ? 'En Curso' : isPaused ? 'Pausado' : 'Detenido'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controles principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Iniciar/Pausar/Reanudar */}
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium disabled:opacity-50 text-white shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {loading ? 'Iniciando...' : 'Iniciar'}
            </button>
          ) : isPaused ? (
            <button
              onClick={handleResume}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium disabled:opacity-50 text-white shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {loading ? 'Reanudando...' : 'Reanudar'}
            </button>
          ) : (
            <button
              onClick={handlePause}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium disabled:opacity-50 text-white shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-r from-yellow-500 to-orange-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {loading ? 'Pausando...' : 'Pausar'}
            </button>
          )}

          {/* Retroceder nivel */}
          <button
            onClick={handlePreviousLevel}
            disabled={loading || currentLevel <= 0}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium disabled:opacity-50 text-white shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-r from-gray-500 to-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            Anterior
          </button>

          {/* Avanzar nivel */}
          <button
            onClick={handleNextLevel}
            disabled={loading || currentLevel >= tournament.blindStructure.length - 1}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium disabled:opacity-50 text-white shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-r from-blue-500 to-indigo-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            Siguiente
          </button>

          {/* Reiniciar nivel */}
          <button
            onClick={handleResetLevel}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium disabled:opacity-50 text-white shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-r from-orange-500 to-red-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Nivel
          </button>
        </div>

        {/* Progreso del torneo */}
        <div className="text-center mb-6">
          <div className="text-lg text-gray-600 mb-2 font-medium">
            Progreso: {currentLevel + 1} / {tournament.blindStructure.length} niveles
          </div>
          {tournament.blindStructure.length > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="h-4 rounded-full transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-600" 
                style={{ 
                  width: `${((currentLevel + 1) / tournament.blindStructure.length) * 100}%`
                }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 