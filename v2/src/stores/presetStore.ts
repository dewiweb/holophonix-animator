import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AnimationPreset } from '@/types'
import { defaultPresets } from '@/data/defaultPresets'

interface PresetStore {
  presets: AnimationPreset[]
  addPreset: (preset: AnimationPreset) => void
  removePreset: (id: string) => void
  updatePreset: (id: string, updates: Partial<AnimationPreset>) => void
  getPresetsByCategory: (category: string) => AnimationPreset[]
  searchPresets: (query: string) => AnimationPreset[]
  resetToDefaults: () => void
}

export const usePresetStore = create<PresetStore>()(
  persist(
    (set, get) => ({
      presets: defaultPresets,
      
      addPreset: (preset) => set((state) => ({
        presets: [...state.presets, preset]
      })),
      
      removePreset: (id) => set((state) => ({
        presets: state.presets.filter(p => p.id !== id)
      })),
      
      updatePreset: (id, updates) => set((state) => ({
        presets: state.presets.map(p => 
          p.id === id ? { ...p, ...updates, modifiedAt: new Date().toISOString() } : p
        )
      })),
      
      getPresetsByCategory: (category) => {
        return get().presets.filter(p => p.category === category)
      },
      
      searchPresets: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().presets.filter(p =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.description?.toLowerCase().includes(lowerQuery) ||
          p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        )
      },
      
      resetToDefaults: () => set({
        presets: defaultPresets
      })
    }),
    {
      name: 'holophonix-animation-presets',
      version: 1
    }
  )
)
