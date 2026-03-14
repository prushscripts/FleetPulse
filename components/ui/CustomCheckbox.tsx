'use client'

import { useState } from 'react'

interface CustomCheckboxProps {
  id: string
  label: string
  checked?: boolean
  onChange?: (checked: boolean) => void
}

export default function CustomCheckbox({ id, label, checked = false, onChange }: CustomCheckboxProps) {
  const [isChecked, setIsChecked] = useState(checked)

  const handleChange = () => {
    const newValue = !isChecked
    setIsChecked(newValue)
    onChange?.(newValue)
  }

  return (
    <label htmlFor={id} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={isChecked}
          onChange={handleChange}
          className="sr-only"
        />
        <div
          className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center ${
            isChecked
              ? 'bg-indigo-600 border-indigo-600'
              : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 group-hover:border-indigo-400 dark:group-hover:border-indigo-500'
          }`}
        >
          {isChecked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <span className="select-none text-xs">{label}</span>
    </label>
  )
}
