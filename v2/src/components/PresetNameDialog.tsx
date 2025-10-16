import React, { useState } from 'react'
import { X } from 'lucide-react'

interface PresetNameDialogProps {
  isOpen: boolean
  defaultName: string
  onConfirm: (name: string, description: string) => void
  onCancel: () => void
}

export const PresetNameDialog: React.FC<PresetNameDialogProps> = ({
  isOpen,
  defaultName,
  onConfirm,
  onCancel
}) => {
  const [name, setName] = useState(defaultName)
  const [description, setDescription] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onConfirm(name.trim(), description.trim())
      setName('')
      setDescription('')
    }
  }

  const handleCancel = () => {
    setName('')
    setDescription('')
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Save Animation Preset</h2>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Preset Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preset Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter preset name"
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description <span className="text-gray-400 dark:text-gray-500 text-xs">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter a brief description"
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Save Preset
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
