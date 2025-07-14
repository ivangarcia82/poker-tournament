"use client"

import { useState, useRef } from 'react'

const DEFAULT_COLORS = {
  primary: '#2563eb',
  secondary: '#f3f4f6',
  accent: '#22c55e'
}

export default function ClubOnboarding({ userId, onComplete }: { userId: string, onComplete: () => void }) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [colors, setColors] = useState(DEFAULT_COLORS)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      setLogoUrl(URL.createObjectURL(file))
    }
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColors({ ...colors, [e.target.name]: e.target.value })
  }

  const handleNext = () => {
    setError(null)
    if (step === 1 && !name.trim()) {
      setError('El nombre del club es obligatorio')
      return
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setError(null)
    setStep(step - 1)
  }

  const handleCreateClub = async () => {
    setSaving(true)
    setError(null)
    let logoToSend = null
    if (logoFile) {
      logoToSend = await fileToBase64(logoFile)
    }
    try {
      // 1. Crear el club
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          logoUrl: logoToSend,
          colorPrimary: colors.primary,
          colorSecondary: colors.secondary,
          colorAccent: colors.accent
        })
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Error al crear el club')
        setSaving(false)
        return
      }
      const club = await res.json()
      // 2. Actualizar el usuario con el clubId
      const resUser = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId: club.id })
      })
      if (!resUser.ok) {
        setError('Error al asociar el club al usuario')
        setSaving(false)
        return
      }
      onComplete()
    } catch (e) {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/20 max-w-2xl mx-auto">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
      
      <div className="relative p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Bienvenido! Crea tu club</h2>
          <p className="text-gray-600">Configura tu club de poker en pocos pasos</p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Paso {step} de 4</span>
            <span className="text-sm font-medium text-gray-600">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Nombre del club */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nombre del Club</h3>
              <p className="text-gray-600">Elige un nombre memorable para tu club</p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Nombre del club <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  autoFocus 
                  placeholder="Ej: Club de Poker Madrid"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Logo del club */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Logo del Club</h3>
              <p className="text-gray-600">Sube el logo de tu club (opcional)</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-200 shadow-lg">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo preview" className="object-contain w-full h-full" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-gray-500">Sin logo</span>
                    </div>
                  )}
                </div>
                <button
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-medium"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Subir logo</span>
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Colores del club */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Colores del Club</h3>
              <p className="text-gray-600">Personaliza la apariencia de tu club</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <label className="flex flex-col items-center space-y-2">
                    <span className="text-sm font-medium text-gray-700">Color Primario</span>
                    <div className="relative">
                      <input 
                        type="color" 
                        name="primary" 
                        value={colors.primary} 
                        onChange={handleColorChange} 
                        className="w-16 h-16 border-2 border-gray-200 rounded-xl shadow-lg cursor-pointer"
                      />
                      <div className="absolute inset-0 rounded-xl border-2 border-transparent pointer-events-none"></div>
                    </div>
                  </label>
                </div>
                <div className="text-center">
                  <label className="flex flex-col items-center space-y-2">
                    <span className="text-sm font-medium text-gray-700">Color Secundario</span>
                    <div className="relative">
                      <input 
                        type="color" 
                        name="secondary" 
                        value={colors.secondary} 
                        onChange={handleColorChange} 
                        className="w-16 h-16 border-2 border-gray-200 rounded-xl shadow-lg cursor-pointer"
                      />
                      <div className="absolute inset-0 rounded-xl border-2 border-transparent pointer-events-none"></div>
                    </div>
                  </label>
                </div>
                <div className="text-center">
                  <label className="flex flex-col items-center space-y-2">
                    <span className="text-sm font-medium text-gray-700">Color Acento</span>
                    <div className="relative">
                      <input 
                        type="color" 
                        name="accent" 
                        value={colors.accent} 
                        onChange={handleColorChange} 
                        className="w-16 h-16 border-2 border-gray-200 rounded-xl shadow-lg cursor-pointer"
                      />
                      <div className="absolute inset-0 rounded-xl border-2 border-transparent pointer-events-none"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Vista previa */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Vista Previa</h3>
              <p className="text-gray-600">Así se verá tu club</p>
            </div>
            
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl border-2 border-white shadow-xl p-6" style={{ background: colors.secondary }}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                <div className="relative flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-lg">
                    <div className="absolute inset-0" style={{ backgroundColor: colors.primary }}></div>
                    <img 
                      src={logoUrl || '/logo-default.svg'} 
                      alt="Logo preview" 
                      className="relative w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {name || 'Nombre del Club'}
                    </span>
                    <div className="text-sm mt-1" style={{ color: colors.accent }}>
                      Torneos y administración
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 && (
            <button 
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-medium disabled:opacity-50" 
              onClick={handleBack} 
              disabled={saving}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Atrás</span>
            </button>
          )}
          {step < 4 && (
            <button 
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-medium ml-auto" 
              onClick={handleNext} 
              disabled={saving}
            >
              <span>Siguiente</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {step === 4 && (
            <button 
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-medium ml-auto disabled:opacity-50" 
              onClick={handleCreateClub} 
              disabled={saving}
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Crear club</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 