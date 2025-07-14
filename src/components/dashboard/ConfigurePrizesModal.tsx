import { useState } from 'react'

interface ConfigurePrizesModalProps {
  prizePool: number
  initialPrizes: { position: number; percentage: number }[]
  onClose: () => void
  onSave: (prizes: { position: number; percentage: number }[]) => void
}

export default function ConfigurePrizesModal({ prizePool, initialPrizes, onClose, onSave }: ConfigurePrizesModalProps) {
  const [numWinners, setNumWinners] = useState(initialPrizes.length || 3)
  const [percentages, setPercentages] = useState<number[]>(
    initialPrizes.length > 0 ? initialPrizes.map(p => p.percentage) : [50, 30, 20]
  )
  const totalPercent = percentages.reduce((a, b) => a + b, 0)
  const isValid = totalPercent === 100 && percentages.every(p => p > 0)

  const handleNumWinnersChange = (n: number) => {
    setNumWinners(n)
    setPercentages((prev) => {
      if (n > prev.length) {
        return [...prev, ...Array(n - prev.length).fill(0)]
      } else {
        return prev.slice(0, n)
      }
    })
  }

  const handlePercentageChange = (idx: number, value: number) => {
    setPercentages((prev) => prev.map((p, i) => (i === idx ? value : p)))
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl max-w-lg w-full border border-white/20">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/30 to-orange-50/30"></div>
        <div className="relative p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Configurar Premios</h2>
                <p className="text-gray-600 mt-1">Distribuye el premio total de ${prizePool.toLocaleString()}</p>
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

          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Número de Premiados</h3>
                </div>
                
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={numWinners}
                  onChange={e => handleNumWinnersChange(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-50/50 to-orange-50/50"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Porcentajes por Posición</h3>
                </div>
                
                <div className="space-y-3">
                  {Array.from({ length: numWinners }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-white/80 rounded-lg border border-white/30">
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg shadow-sm">
                        <span className="text-xs font-bold text-white">#{i + 1}</span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={percentages[i] || 0}
                        onChange={e => handlePercentageChange(i, Number(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                      />
                      <span className="text-sm font-medium text-gray-600">%</span>
                      <div className="text-sm font-semibold text-gray-900 min-w-[80px] text-right">
                        ${((percentages[i] || 0) * prizePool / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 p-4">
              <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 to-emerald-50/50"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Suma total:</span>
                </div>
                <span className={`text-lg font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPercent}%
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button 
                onClick={onClose} 
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-medium">Cancelar</span>
              </button>
              <button
                onClick={() => onSave(percentages.map((p, i) => ({ position: i + 1, percentage: p })))}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isValid}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Guardar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 