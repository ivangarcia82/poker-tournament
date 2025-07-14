'use client'

import { useState } from 'react'

interface Bonus {
  id: string
  name: string
  chips: number
  price: number
  availableInBuyIn: boolean
  availableInRebuy: boolean
  availableInAddOn: boolean
  description?: string
}

interface BonusSelectorProps {
  bonuses: Bonus[]
  selectedBonuses: string[]
  onSelectionChange: (selectedIds: string[]) => void
  context: 'buyIn' | 'rebuy' | 'addOn'
  buyInPrice: number
  initialStack: number
}

export default function BonusSelector({ 
  bonuses, 
  selectedBonuses, 
  onSelectionChange, 
  context,
  buyInPrice,
  initialStack
}: BonusSelectorProps) {
  const [expandedBonus, setExpandedBonus] = useState<string | null>(null)

  const availableBonuses = bonuses.filter(bonus => {
    if (context === 'buyIn') {
      return bonus.availableInBuyIn
    } else if (context === 'addOn') {
      return bonus.availableInAddOn
    } else {
      return bonus.availableInRebuy
    }
  })

  const handleBonusToggle = (bonusId: string) => {
    const newSelection = selectedBonuses.includes(bonusId)
      ? selectedBonuses.filter(id => id !== bonusId)
      : [...selectedBonuses, bonusId]
    onSelectionChange(newSelection)
  }

  const calculateTotals = () => {
    let totalPrice = buyInPrice
    let totalChips = initialStack

    selectedBonuses.forEach(bonusId => {
      const bonus = bonuses.find(b => b.id === bonusId)
      if (bonus) {
        totalPrice += bonus.price
        totalChips += bonus.chips
      }
    })

    return { totalPrice, totalChips }
  }

  const { totalPrice, totalChips } = calculateTotals()

  if (availableBonuses.length === 0) {
    const contextText = context === 'buyIn' ? 'compra inicial' : context === 'addOn' ? 'add-on' : 'recompra'
    return (
      <div className="text-gray-500 text-center py-4">
        No hay bonos disponibles para {contextText}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-2">
        Selecciona los bonos que quieres aplicar:
      </div>
      
      <div className="space-y-2">
        {availableBonuses.map(bonus => (
          <div key={bonus.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={bonus.id}
                  checked={selectedBonuses.includes(bonus.id)}
                  onChange={() => handleBonusToggle(bonus.id)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor={bonus.id} className="font-medium text-gray-900 cursor-pointer">
                  {bonus.name}
                </label>
              </div>
              <div className="text-sm text-gray-600">
                +{bonus.chips.toLocaleString()} fichas • ${bonus.price}
              </div>
            </div>
            
            {bonus.description && (
              <div className="mt-2 text-sm text-gray-500">
                {bonus.description}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total:</span>
          <div className="text-right">
            <div className="text-green-600">${totalPrice.toLocaleString()}</div>
            <div className="text-sm text-gray-600">{totalChips.toLocaleString()} fichas</div>
          </div>
        </div>
      </div>
    </div>
  )
} 