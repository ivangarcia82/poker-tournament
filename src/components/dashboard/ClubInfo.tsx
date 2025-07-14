"use client"

import { useState, useEffect, useRef } from 'react'

interface ClubInfo {
  id: string
  name: string
  logoUrl?: string
  colorPrimary: string
  colorSecondary: string
  colorAccent: string
}

interface ClubInfoProps {
  user: any
}

export default function ClubInfo({ user }: ClubInfoProps) {
  const [club, setClub] = useState<ClubInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    logoUrl: '',
    colorPrimary: '#2563eb',
    colorSecondary: '#f3f4f6',
    colorAccent: '#22c55e'
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchClubInfo()
  }, [])

  const fetchClubInfo = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        if (userData.club) {
          setClub(userData.club)
          setEditForm({
            name: userData.club.name,
            logoUrl: userData.club.logoUrl || '',
            colorPrimary: userData.club.colorPrimary || '#2563eb',
            colorSecondary: userData.club.colorSecondary || '#f3f4f6',
            colorAccent: userData.club.colorAccent || '#22c55e'
          })
        }
      }
    } catch (error) {
      setError('Error al cargar la información del club')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      let logoToSend = editForm.logoUrl
      if (logoFile) {
        logoToSend = await fileToBase64(logoFile)
      }

      const response = await fetch(`/api/clubs/${club?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          logoUrl: logoToSend,
          colorPrimary: editForm.colorPrimary,
          colorSecondary: editForm.colorSecondary,
          colorAccent: editForm.colorAccent
        })
      })

      if (response.ok) {
        setSuccess('Información del club actualizada correctamente')
        setIsEditing(false)
        setLogoFile(null)
        setLogoPreview(null)
        fetchClubInfo() // Recargar datos
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al actualizar el club')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-4">Información del Club</h2>
        <p className="text-gray-600">No se encontró información del club.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Información del Club</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Editar
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {!isEditing ? (
        // Vista de solo lectura
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
              {club.logoUrl ? (
                <img src={club.logoUrl} alt="Logo del club" className="object-contain w-full h-full" />
              ) : (
                <img src="/logo-default.svg" alt="Logo por defecto" className="object-contain w-full h-full" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{club.name}</h3>
              <p className="text-gray-600">Club de póker</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color Primario</label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: club.colorPrimary }}
                ></div>
                <span className="text-sm text-gray-600">{club.colorPrimary}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color Secundario</label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: club.colorSecondary }}
                ></div>
                <span className="text-sm text-gray-600">{club.colorSecondary}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color Acento</label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: club.colorAccent }}
                ></div>
                <span className="text-sm text-gray-600">{club.colorAccent}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Vista de edición
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Club
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Nombre del club"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo del Club
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="object-contain w-full h-full" />
                ) : club.logoUrl ? (
                  <img src={club.logoUrl} alt="Logo actual" className="object-contain w-full h-full" />
                ) : (
                  <img src="/logo-default.svg" alt="Logo por defecto" className="object-contain w-full h-full" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
              >
                Cambiar logo
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colores del Club
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2">
                  <span className="text-sm">Primario</span>
                  <input
                    type="color"
                    name="colorPrimary"
                    value={editForm.colorPrimary}
                    onChange={handleColorChange}
                    className="w-8 h-8 border-none"
                  />
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <span className="text-sm">Secundario</span>
                  <input
                    type="color"
                    name="colorSecondary"
                    value={editForm.colorSecondary}
                    onChange={handleColorChange}
                    className="w-8 h-8 border-none"
                  />
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <span className="text-sm">Acento</span>
                  <input
                    type="color"
                    name="colorAccent"
                    value={editForm.colorAccent}
                    onChange={handleColorChange}
                    className="w-8 h-8 border-none"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsEditing(false)
                setLogoFile(null)
                setLogoPreview(null)
                setEditForm({
                  name: club.name,
                  logoUrl: club.logoUrl || '',
                  colorPrimary: club.colorPrimary,
                  colorSecondary: club.colorSecondary,
                  colorAccent: club.colorAccent
                })
              }}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 