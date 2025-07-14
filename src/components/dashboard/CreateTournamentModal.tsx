'use client'

import { useState, useEffect } from 'react'
import { Tournament } from '@/types'

interface BlindLevel {
  level: number
  smallBlind: number
  bigBlind: number
  ante: number
  duration: number
  isPause: boolean
}

interface CreateTournamentModalProps {
  onClose: () => void
  onSubmit: (data: any) => void
  tournament?: Tournament | null // Para edición
}

export default function CreateTournamentModal({ onClose, onSubmit, tournament }: CreateTournamentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    buyIn: 0,
    doubleBuyIn: false,
    doubleBuyInPrice: 0,
    doubleBuyInChips: 0,
    addOn: 0,
    addOnChips: 0,
    rake: 0,
    maxPlayers: 0,
    minPlayers: 0,
    startTime: '',
    initialStack: 5000,
    rebuy: 0,
    rebuyChips: 0,
    doubleRebuy: false,
    doubleRebuyPrice: 0,
    doubleRebuyChips: 0,
    pauseLevel: 0
  })

  const [blindStructure, setBlindStructure] = useState<BlindLevel[]>([
    { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 20, isPause: false },
    { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 20, isPause: false },
    { level: 3, smallBlind: 75, bigBlind: 150, ante: 0, duration: 20, isPause: false },
    { level: 4, smallBlind: 100, bigBlind: 200, ante: 0, duration: 20, isPause: false },
    { level: 5, smallBlind: 150, bigBlind: 300, ante: 0, duration: 20, isPause: false },
    { level: 6, smallBlind: 200, bigBlind: 400, ante: 0, duration: 20, isPause: false },
    { level: 7, smallBlind: 300, bigBlind: 600, ante: 0, duration: 20, isPause: false },
    { level: 8, smallBlind: 400, bigBlind: 800, ante: 0, duration: 20, isPause: false },
    { level: 9, smallBlind: 500, bigBlind: 1000, ante: 0, duration: 20, isPause: false },
    { level: 10, smallBlind: 600, bigBlind: 1200, ante: 0, duration: 20, isPause: false }
  ])

  const [prizes, setPrizes] = useState([
    { position: 1, percentage: 50 },
    { position: 2, percentage: 30 },
    { position: 3, percentage: 20 }
  ])

  const [bonuses, setBonuses] = useState([
    { name: '', chips: 0, price: 0, availableInBuyIn: true, availableInRebuy: false, availableInAddOn: false, description: '' }
  ])

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Cargar datos del torneo si estamos editando
  useEffect(() => {
    if (tournament) {
      setFormData({
        name: tournament.name,
        description: tournament.description || '',
        buyIn: tournament.buyIn,
        doubleBuyIn: tournament.doubleBuyIn,
        doubleBuyInPrice: tournament.doubleBuyInPrice || 0,
        doubleBuyInChips: tournament.doubleBuyInChips || 0,
        addOn: tournament.addOn || 0,
        addOnChips: tournament.addOnChips || 0,
        rake: tournament.rake,
        maxPlayers: tournament.maxPlayers,
        minPlayers: tournament.minPlayers,
        startTime: new Date(tournament.startTime).toISOString().slice(0, 16),
        initialStack: tournament.initialStack,
        rebuy: tournament.rebuy || 0,
        rebuyChips: tournament.rebuyChips || 0,
        doubleRebuy: tournament.doubleRebuy,
        doubleRebuyPrice: tournament.doubleRebuyPrice || 0,
        doubleRebuyChips: tournament.doubleRebuyChips || 0,
        pauseLevel: tournament.pauseLevel
      })

      if (tournament.blindStructure.length > 0) {
        setBlindStructure(tournament.blindStructure.map(blind => ({
          level: blind.level,
          smallBlind: blind.smallBlind,
          bigBlind: blind.bigBlind,
          ante: blind.ante,
          duration: blind.duration,
          isPause: blind.isPause
        })))
      }

      if (tournament.prizes.length > 0) {
        setPrizes(tournament.prizes.map(prize => ({
          position: prize.position,
          percentage: prize.percentage
        })))
      }

      if (tournament.bonuses.length > 0) {
        setBonuses(tournament.bonuses.map(bonus => ({
          name: bonus.name,
          chips: bonus.chips,
          price: bonus.price,
          availableInBuyIn: bonus.availableInBuyIn,
          availableInRebuy: bonus.availableInRebuy,
          availableInAddOn: bonus.availableInAddOn || false,
          description: bonus.description || ''
        })))
      }
    }
  }, [tournament])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }))

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleBlindChange = (index: number, field: keyof BlindLevel, value: any) => {
    const newBlindStructure = [...blindStructure]
    newBlindStructure[index] = { ...newBlindStructure[index], [field]: value }
    setBlindStructure(newBlindStructure)
  }

  const addBlindLevel = () => {
    const newLevel = blindStructure.length + 1
    const lastBlind = blindStructure[blindStructure.length - 1]
    setBlindStructure([...blindStructure, {
      level: newLevel,
      smallBlind: lastBlind ? lastBlind.smallBlind * 1.5 : 1000,
      bigBlind: lastBlind ? lastBlind.bigBlind * 1.5 : 2000,
      ante: 0,
      duration: 20,
      isPause: false
    }])
  }

  const removeBlindLevel = (index: number) => {
    if (blindStructure.length > 1) {
      setBlindStructure(blindStructure.filter((_, i) => i !== index))
    }
  }

  const handlePrizeChange = (index: number, field: 'position' | 'percentage', value: number) => {
    const newPrizes = [...prizes]
    newPrizes[index] = { ...newPrizes[index], [field]: value }
    setPrizes(newPrizes)
  }

  const addPrize = () => {
    setPrizes([...prizes, { position: prizes.length + 1, percentage: 0 }])
  }

  const removePrize = (index: number) => {
    if (prizes.length > 1) {
      setPrizes(prizes.filter((_, i) => i !== index))
    }
  }

  const handleBonusChange = (index: number, field: string, value: any) => {
    const newBonuses = [...bonuses]
    newBonuses[index] = { ...newBonuses[index], [field]: value }
    setBonuses(newBonuses)
  }

  const addBonus = () => {
    setBonuses([...bonuses, { name: '', chips: 0, price: 0, availableInBuyIn: true, availableInRebuy: false, availableInAddOn: false, description: '' }])
  }

  const removeBonus = (index: number) => {
    if (bonuses.length > 1) {
      setBonuses(bonuses.filter((_, i) => i !== index))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido'
    if (formData.buyIn <= 0) newErrors.buyIn = 'El buy-in debe ser mayor a 0'
    if (formData.maxPlayers <= 0) newErrors.maxPlayers = 'El máximo de jugadores debe ser mayor a 0'
    if (formData.minPlayers <= 0) newErrors.minPlayers = 'El mínimo de jugadores debe ser mayor a 0'
    if (formData.minPlayers > formData.maxPlayers) newErrors.minPlayers = 'El mínimo no puede ser mayor al máximo'
    if (!formData.startTime) newErrors.startTime = 'La fecha de inicio es requerida'
    if (formData.rake < 0) newErrors.rake = 'El rake no puede ser negativo'
    if (formData.initialStack <= 0) newErrors.initialStack = 'Las fichas iniciales deben ser mayor a 0'

    // Validar estructura de blinds
    blindStructure.forEach((blind, index) => {
      if (blind.smallBlind <= 0) newErrors[`blind_${index}`] = 'Small blind debe ser mayor a 0'
      if (blind.bigBlind <= 0) newErrors[`blind_${index}`] = 'Big blind debe ser mayor a 0'
      if (blind.bigBlind <= blind.smallBlind) newErrors[`blind_${index}`] = 'Big blind debe ser mayor al small blind'
      if (blind.duration <= 0) newErrors[`blind_${index}`] = 'La duración debe ser mayor a 0'
    })

    // Validar premios
    const totalPercentage = prizes.reduce((sum, prize) => sum + prize.percentage, 0)
    if (Math.abs(totalPercentage - 100) > 0.01) {
      newErrors.prizes = 'Los porcentajes deben sumar 100%'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const tournamentData = {
        ...formData,
        blindStructure,
        prizes,
        bonuses: bonuses.filter(b => b.name.trim() !== '')
      }

      await onSubmit(tournamentData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const isEditing = !!tournament

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto border border-white/20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
        <div className="relative p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {isEditing ? 'Editar Torneo' : 'Crear Nuevo Torneo'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {isEditing ? 'Modifica la configuración del torneo' : 'Configura todos los detalles de tu torneo'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información básica */}
            <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Torneo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                      placeholder="Ej: Torneo de Póker Mensual"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{errors.name}</span>
                    </p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      rows={2}
                      placeholder="Descripción opcional del torneo"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Configuración de buy-in */}
            <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 to-emerald-50/50"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Configuración Financiera</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buy-in ($) *
                    </label>
                    <input
                      type="number"
                      name="buyIn"
                      value={formData.buyIn}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.buyIn ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                      min="0"
                      step="0.01"
                    />
                    {errors.buyIn && <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{errors.buyIn}</span>
                    </p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rake (%)
                    </label>
                    <input
                      type="number"
                      name="rake"
                      value={formData.rake}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.rake ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                      min="0"
                      step="0.01"
                    />
                    {errors.rake && <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{errors.rake}</span>
                    </p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fichas Iniciales *
                    </label>
                    <input
                      type="number"
                      name="initialStack"
                      value={formData.initialStack}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.initialStack ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                      min="1"
                    />
                    {errors.initialStack && <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{errors.initialStack}</span>
                    </p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Buy-in doble */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="doubleBuyIn"
                checked={formData.doubleBuyIn}
                onChange={handleInputChange}
                className="rounded"
              />
              <label className="text-sm font-medium text-gray-700">
                Permitir Buy-in Doble
              </label>
            </div>

            {formData.doubleBuyIn && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Buy-in Doble ($)
                  </label>
                  <input
                    type="number"
                    name="doubleBuyInPrice"
                    value={formData.doubleBuyInPrice}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fichas Buy-in Doble
                  </label>
                  <input
                    type="number"
                    name="doubleBuyInChips"
                    value={formData.doubleBuyInChips}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                  />
                </div>
              </div>
            )}

            {/* Add-on */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Add-on ($)
                </label>
                <input
                  type="number"
                  name="addOn"
                  value={formData.addOn}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fichas Add-on
                </label>
                <input
                  type="number"
                  name="addOnChips"
                  value={formData.addOnChips}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="1"
                />
              </div>
            </div>

            {/* Rebuys */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Rebuy ($)
                </label>
                <input
                  type="number"
                  name="rebuy"
                  value={formData.rebuy}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fichas Rebuy
                </label>
                <input
                  type="number"
                  name="rebuyChips"
                  value={formData.rebuyChips}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="1"
                />
              </div>
            </div>

            {/* Rebuy doble */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="doubleRebuy"
                checked={formData.doubleRebuy}
                onChange={handleInputChange}
                className="rounded"
              />
              <label className="text-sm font-medium text-gray-700">
                Permitir Rebuy Doble
              </label>
            </div>

            {formData.doubleRebuy && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Rebuy Doble ($)
                  </label>
                  <input
                    type="number"
                    name="doubleRebuyPrice"
                    value={formData.doubleRebuyPrice}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fichas Rebuy Doble
                  </label>
                  <input
                    type="number"
                    name="doubleRebuyChips"
                    value={formData.doubleRebuyChips}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                  />
                </div>
              </div>
            )}

            {/* Configuración de jugadores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo de Jugadores *
                </label>
                <input
                  type="number"
                  name="maxPlayers"
                  value={formData.maxPlayers}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.maxPlayers ? 'border-red-500' : 'border-gray-300'}`}
                  min="1"
                />
                {errors.maxPlayers && <p className="text-red-500 text-sm mt-1">{errors.maxPlayers}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mínimo de Jugadores *
                </label>
                <input
                  type="number"
                  name="minPlayers"
                  value={formData.minPlayers}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.minPlayers ? 'border-red-500' : 'border-gray-300'}`}
                  min="1"
                />
                {errors.minPlayers && <p className="text-red-500 text-sm mt-1">{errors.minPlayers}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha y Hora de Inicio *
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.startTime ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
              </div>
            </div>

            {/* Estructura de blinds */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Estructura de Blinds</h3>
                <button
                  type="button"
                  onClick={addBlindLevel}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
                >
                  + Agregar Nivel
                </button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {blindStructure.map((blind, index) => (
                  <div key={index} className="grid grid-cols-6 gap-2 items-center p-2 bg-gray-50 rounded">
                    <div>
                      <label className="block text-xs text-gray-600">Nivel</label>
                      <input
                        type="number"
                        value={blind.level}
                        onChange={(e) => handleBlindChange(index, 'level', parseInt(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">SB</label>
                      <input
                        type="number"
                        value={blind.smallBlind}
                        onChange={(e) => handleBlindChange(index, 'smallBlind', parseInt(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">BB</label>
                      <input
                        type="number"
                        value={blind.bigBlind}
                        onChange={(e) => handleBlindChange(index, 'bigBlind', parseInt(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Ante</label>
                      <input
                        type="number"
                        value={blind.ante}
                        onChange={(e) => handleBlindChange(index, 'ante', parseInt(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Duración (min)</label>
                      <input
                        type="number"
                        value={blind.duration}
                        onChange={(e) => handleBlindChange(index, 'duration', parseInt(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        min="1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={blind.isPause}
                        onChange={(e) => handleBlindChange(index, 'isPause', e.target.checked)}
                        className="rounded"
                      />
                      <label className="text-xs text-gray-600">Pausa</label>
                      {blindStructure.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBlindLevel(index)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Premios */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Estructura de Premios</h3>
                <button
                  type="button"
                  onClick={addPrize}
                  className="px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                >
                  + Agregar Premio
                </button>
              </div>
              
              <div className="space-y-2">
                {prizes.map((prize, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 items-center p-2 bg-gray-50 rounded">
                    <div>
                      <label className="block text-sm text-gray-600">Posición</label>
                      <input
                        type="number"
                        value={prize.position}
                        onChange={(e) => handlePrizeChange(index, 'position', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Porcentaje (%)</label>
                      <input
                        type="number"
                        value={prize.percentage}
                        onChange={(e) => handlePrizeChange(index, 'percentage', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        ${((formData.buyIn * formData.maxPlayers * (1 - formData.rake / 100)) * prize.percentage / 100).toFixed(2)}
                      </span>
                      {prizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePrize(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {errors.prizes && <p className="text-red-500 text-sm">{errors.prizes}</p>}
              </div>
            </div>

            {/* Bonos */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Bonos</h3>
                <button
                  type="button"
                  onClick={addBonus}
                  className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm"
                >
                  + Agregar Bono
                </button>
              </div>
              
              <div className="space-y-2">
                {bonuses.map((bonus, index) => (
                  <div key={index} className="grid grid-cols-2 md:grid-cols-7 gap-2 items-center p-2 bg-gray-50 rounded">
                    <div>
                      <label className="block text-xs text-gray-600">Nombre</label>
                      <input
                        type="text"
                        value={bonus.name}
                        onChange={(e) => handleBonusChange(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="Ej: Bono VIP"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Fichas</label>
                      <input
                        type="number"
                        value={bonus.chips}
                        onChange={(e) => handleBonusChange(index, 'chips', parseInt(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Precio ($)</label>
                      <input
                        type="number"
                        value={bonus.price}
                        onChange={(e) => handleBonusChange(index, 'price', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={bonus.availableInBuyIn}
                        onChange={(e) => handleBonusChange(index, 'availableInBuyIn', e.target.checked)}
                        className="rounded"
                      />
                      <label className="text-xs text-gray-600">Buy-in</label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={bonus.availableInRebuy}
                        onChange={(e) => handleBonusChange(index, 'availableInRebuy', e.target.checked)}
                        className="rounded"
                      />
                      <label className="text-xs text-gray-600">Rebuy</label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={bonus.availableInAddOn}
                        onChange={(e) => handleBonusChange(index, 'availableInAddOn', e.target.checked)}
                        className="rounded"
                      />
                      <label className="text-xs text-gray-600">Add-on</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={bonus.description}
                        onChange={(e) => handleBonusChange(index, 'description', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="Descripción"
                      />
                      {bonuses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBonus(index)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-8">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-medium">Cancelar</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="font-medium">Guardando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">{isEditing ? 'Actualizar Torneo' : 'Crear Torneo'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 