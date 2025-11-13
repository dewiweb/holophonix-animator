import React from 'react'
import { AnimationModel, ParameterDefinition } from '@/models/types'
import { Position } from '@/types'
import { validateParameters } from '@/models/validation'
import { Info, AlertCircle } from 'lucide-react'

interface ModelParametersFormProps {
  model: AnimationModel
  parameters: Record<string, any>
  onChange: (key: string, value: any) => void
  trackPosition?: Position
}

export const ModelParametersForm: React.FC<ModelParametersFormProps> = ({
  model,
  parameters,
  onChange,
  trackPosition = { x: 0, y: 0, z: 0 }
}) => {
  // Validate current parameters
  const validation = validateParameters(model, parameters)
  
  // Get default parameters from model if method exists
  const getDefaultValue = (key: string) => {
    if (model.getDefaultParameters && typeof model.getDefaultParameters === 'function') {
      const defaults = model.getDefaultParameters(trackPosition)
      return defaults[key]
    }
    return model.parameters[key].default
  }
  
  // Check if a parameter should be shown based on dependencies
  const shouldShowParameter = (key: string, def: ParameterDefinition): boolean => {
    if (!def.dependsOn || def.dependsOn.length === 0) return true
    
    return def.dependsOn.every(dep => {
      const paramValue = parameters[dep.parameter]
      switch (dep.condition) {
        case 'equals':
          return paramValue === dep.value
        case 'notEquals':
          return paramValue !== dep.value
        case 'greaterThan':
          return paramValue > dep.value
        case 'lessThan':
          return paramValue < dep.value
        default:
          return true
      }
    })
  }
  
  // Group parameters by category
  const groupedParameters = Object.entries(model.parameters).reduce((acc, [key, def]) => {
    if (def.hidden) return acc
    
    const group = def.advanced ? 'Advanced' : 'Basic'
    if (!acc[group]) acc[group] = []
    acc[group].push({ key, definition: def })
    return acc
  }, {} as Record<string, Array<{ key: string; definition: ParameterDefinition }>>)
  
  const renderParameterInput = (key: string, def: ParameterDefinition) => {
    const value = parameters[key] ?? getDefaultValue(key)
    const hasError = validation.errors.some(e => e.includes(key))
    
    if (!shouldShowParameter(key, def)) return null
    
    switch (def.type) {
      case 'number':
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {def.label}
                {def.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {def.description && (
                <div className="group relative">
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded p-2 w-48">
                      {def.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <input
              type="number"
              value={value ?? def.default ?? 0}
              onChange={(e) => onChange(key, parseFloat(e.target.value))}
              min={def.min}
              max={def.max}
              step={def.step ?? 0.1}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                hasError 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            />
            {def.unit && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{def.unit}</span>
            )}
          </div>
        )
        
      case 'position':
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {def.label}
                {def.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {def.description && (
                <div className="group relative">
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded p-2 w-48">
                      {def.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['x', 'y', 'z'].map(axis => (
                <div key={axis}>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">{axis}</label>
                  <input
                    type="number"
                    value={value?.[axis] ?? def.default?.[axis] ?? 0}
                    onChange={(e) => onChange(key, { ...value, [axis]: parseFloat(e.target.value) })}
                    step={0.1}
                    className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 ${
                      hasError 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  />
                </div>
              ))}
            </div>
          </div>
        )
        
      case 'rotation':
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {def.label}
                {def.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {def.description && (
                <div className="group relative">
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded p-2 w-48">
                      {def.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['x', 'y', 'z'].map(axis => (
                <div key={axis}>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    {axis === 'x' ? 'Pitch' : axis === 'y' ? 'Yaw' : 'Roll'} ({axis}°)
                  </label>
                  <input
                    type="number"
                    value={value?.[axis] ?? def.default?.[axis] ?? 0}
                    onChange={(e) => onChange(key, { ...value, [axis]: parseFloat(e.target.value) })}
                    min={-180}
                    max={180}
                    step={15}
                    className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 ${
                      hasError 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  />
                </div>
              ))}
            </div>
          </div>
        )
        
      case 'boolean':
        return (
          <div key={key} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {def.label}
              </label>
              {def.description && (
                <div className="group relative">
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded p-2 w-48">
                      {def.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value ?? def.default ?? false}
                onChange={(e) => onChange(key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        )
        
      case 'enum':
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {def.label}
              </label>
              {def.description && (
                <div className="group relative">
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded p-2 w-48">
                      {def.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <select
              value={value ?? def.default ?? def.options?.[0]}
              onChange={(e) => onChange(key, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                hasError 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            >
              {def.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )
        
      case 'string':
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {def.label}
              </label>
              {def.description && (
                <div className="group relative">
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded p-2 w-48">
                      {def.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <input
              type="text"
              value={value ?? def.default ?? ''}
              onChange={(e) => onChange(key, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                hasError 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            />
          </div>
        )
        
      default:
        return null
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      {!validation.valid && validation.errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Parameter validation errors:
              </p>
              <ul className="mt-1 text-xs text-red-700 dark:text-red-300 list-disc list-inside">
                {validation.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Basic Parameters */}
      {groupedParameters.Basic && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Parameters
          </h3>
          <div className="space-y-4">
            {groupedParameters.Basic.map(({ key, definition }) => 
              renderParameterInput(key, definition)
            )}
          </div>
        </div>
      )}
      
      {/* Advanced Parameters */}
      {groupedParameters.Advanced && groupedParameters.Advanced.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
            Advanced Parameters
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              ({groupedParameters.Advanced.length})
            </span>
          </summary>
          <div className="mt-3 space-y-4">
            {groupedParameters.Advanced.map(({ key, definition }) => 
              renderParameterInput(key, definition)
            )}
          </div>
        </details>
      )}
      
      {/* Model Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>Model: {model.metadata.name} v{model.metadata.version || '1.0.0'}</p>
          {model.metadata.author && <p>Author: {model.metadata.author}</p>}
        </div>
      </div>
    </div>
  )
}
