import { useState, useRef } from 'react'

const DEFAULT_LOGO = '/public/logo-default.svg'
const DEFAULT_COLORS = {
  primary: '#2563eb', // azul
  secondary: '#f3f4f6', // gris claro
  accent: '#22c55e' // verde
}

interface ClubBrandingSettingsProps {
  initialLogoUrl?: string
  initialColors?: {
    primary: string
    secondary: string
    accent: string
  }
  clubId: string
}

export default function ClubBrandingSettings({ initialLogoUrl, initialColors, clubId }: ClubBrandingSettingsProps) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl || DEFAULT_LOGO)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [colors, setColors] = useState(initialColors || DEFAULT_COLORS)
  const [previewColors, setPreviewColors] = useState(colors)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
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
    setPreviewColors({ ...colors, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setSaving(true)
    setFeedback(null)
    let logoToSend = logoUrl
    // Si hay un archivo nuevo, convertirlo a base64 (temporal)
    if (logoFile) {
      logoToSend = await fileToBase64(logoFile)
    }
    try {
      const res = await fetch(`/api/clubs/${clubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl: logoToSend,
          colorPrimary: colors.primary,
          colorSecondary: colors.secondary,
          colorAccent: colors.accent
        })
      })
      if (res.ok) {
        setFeedback('¡Branding guardado exitosamente!')
      } else {
        const err = await res.json()
        setFeedback(err.error || 'Error al guardar')
      }
    } catch (error) {
      setFeedback('Error de conexión')
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
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-2">Branding del Club</h2>
      <div className="flex items-center gap-6">
        <div>
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
            <img src={logoUrl} alt="Logo del club" className="object-contain w-full h-full" />
          </div>
          <button
            className="mt-2 px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
          >
            Subir logo
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2">
            <span className="w-20">Primario</span>
            <input type="color" name="primary" value={colors.primary} onChange={handleColorChange} className="w-8 h-8 border-none" disabled={saving} />
          </label>
          <label className="flex items-center gap-2">
            <span className="w-20">Secundario</span>
            <input type="color" name="secondary" value={colors.secondary} onChange={handleColorChange} className="w-8 h-8 border-none" disabled={saving} />
          </label>
          <label className="flex items-center gap-2">
            <span className="w-20">Acento</span>
            <input type="color" name="accent" value={colors.accent} onChange={handleColorChange} className="w-8 h-8 border-none" disabled={saving} />
          </label>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Vista previa</h3>
        <div className="rounded-lg border p-4 flex items-center gap-4" style={{ background: previewColors.secondary }}>
          <img src={logoUrl} alt="Logo preview" className="w-12 h-12 rounded-full border border-gray-200" />
          <div>
            <span className="text-lg font-bold" style={{ color: previewColors.primary }}>Nombre del Club</span>
            <div className="mt-1 text-sm" style={{ color: previewColors.accent }}>Torneos y administración</div>
          </div>
        </div>
      </div>
      {feedback && <div className={`text-sm ${feedback.startsWith('¡') ? 'text-green-600' : 'text-red-600'}`}>{feedback}</div>}
      <div className="flex justify-end">
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
} 