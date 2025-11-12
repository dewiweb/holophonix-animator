import { describe, it, expect, beforeEach } from 'vitest'
import { useAnimationEditorStoreV2 } from '@/stores/animationEditorStoreV2'
import { Animation } from '@/types'

describe('AnimationEditorStoreV2', () => {
  beforeEach(() => {
    // Reset store before each test
    useAnimationEditorStoreV2.getState().reset()
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const store = useAnimationEditorStoreV2.getState()
      
      expect(store.animationForm).toEqual({
        name: '',
        type: 'linear',
        duration: 10,
        loop: false,
        pingPong: false,
        coordinateSystem: { type: 'xyz' },
        parameters: {}
      })
      expect(store.keyframes).toEqual([])
      expect(store.multiTrackMode).toBe('position-relative')
      expect(store.previewMode).toBe(false)
    })
  })

  describe('Form Actions', () => {
    it('should update animation form', () => {
      const store = useAnimationEditorStoreV2.getState()
      
      const newForm: Partial<Animation> = {
        name: 'Test Animation',
        type: 'circular',
        duration: 20
      }
      
      store.setAnimationForm(newForm)
      expect(useAnimationEditorStoreV2.getState().animationForm).toEqual(newForm)
    })

    it('should update single parameter', () => {
      const store = useAnimationEditorStoreV2.getState()
      
      store.updateParameter('radius', 5)
      expect(useAnimationEditorStoreV2.getState().animationForm.parameters?.radius).toBe(5)
    })

    it('should load animation', () => {
      const store = useAnimationEditorStoreV2.getState()
      
      const animation: Animation = {
        id: 'test-1',
        name: 'Test Animation',
        type: 'circular',
        duration: 15,
        loop: true,
        pingPong: false,
        coordinateSystem: { type: 'xyz' },
        parameters: { radius: 5 },
        keyframes: []
      }
      
      store.loadAnimation(animation)
      
      const state = useAnimationEditorStoreV2.getState()
      expect(state.animationForm.name).toBe('Test Animation')
      expect(state.loadedAnimationId).toBe('test-1')
      expect(state.originalAnimationParams).toEqual({ radius: 5 })
    })
  })

  describe('Keyframe Actions', () => {
    it('should add keyframe', () => {
      const store = useAnimationEditorStoreV2.getState()
      
      const keyframe = {
        id: 'kf1',
        time: 0,
        position: { x: 0, y: 0, z: 0 },
        interpolation: 'linear' as const
      }
      
      store.addKeyframe(keyframe)
      expect(useAnimationEditorStoreV2.getState().keyframes).toHaveLength(1)
      expect(useAnimationEditorStoreV2.getState().keyframes[0].id).toBe('kf1')
    })

    it('should delete keyframe', () => {
      const store = useAnimationEditorStoreV2.getState()
      
      store.addKeyframe({
        id: 'kf1',
        time: 0,
        position: { x: 0, y: 0, z: 0 },
        interpolation: 'linear'
      })
      store.deleteKeyframe('kf1')
      
      expect(useAnimationEditorStoreV2.getState().keyframes).toHaveLength(0)
    })
  })

  describe('Multi-Track Actions', () => {
    it('should set multi-track mode', () => {
      const store = useAnimationEditorStoreV2.getState()
      
      store.setMultiTrackMode('identical')
      expect(useAnimationEditorStoreV2.getState().multiTrackMode).toBe('identical')
    })

    it('should set phase offset seconds', () => {
      const store = useAnimationEditorStoreV2.getState()
      
      store.setPhaseOffsetSeconds(2.5)
      expect(useAnimationEditorStoreV2.getState().phaseOffsetSeconds).toBe(2.5)
    })
  })

  describe('UI Actions', () => {
    it('should toggle preview mode', () => {
      const store = useAnimationEditorStoreV2.getState()
      
      store.setPreviewMode(true)
      expect(useAnimationEditorStoreV2.getState().previewMode).toBe(true)
    })
  })

  describe('Computed Values', () => {
    it('should detect dirty state', () => {
      const store = useAnimationEditorStoreV2.getState()
      
      // Initially not dirty
      expect(store.isDirty()).toBe(false)
      
      // Load animation
      store.loadAnimation({
        id: 'test',
        name: 'Test',
        type: 'circular',
        duration: 10,
        loop: false,
        pingPong: false,
        coordinateSystem: { type: 'xyz' },
        parameters: { radius: 5 },
        keyframes: []
      })
      
      // Not dirty yet
      expect(useAnimationEditorStoreV2.getState().isDirty()).toBe(false)
      
      // Modify parameter
      useAnimationEditorStoreV2.getState().updateParameter('radius', 10)
      
      // Now dirty
      expect(useAnimationEditorStoreV2.getState().isDirty()).toBe(true)
    })
  })

  describe('Utility Actions', () => {
    it('should reset to initial state', () => {
      const store = useAnimationEditorStoreV2.getState()
      
      // Modify state
      store.setAnimationForm({ name: 'Test', type: 'circular' })
      store.setPreviewMode(true)
      
      // Reset
      store.reset()
      
      // Check reset
      const state = useAnimationEditorStoreV2.getState()
      expect(state.animationForm.name).toBe('')
      expect(state.animationForm.type).toBe('linear')
      expect(state.previewMode).toBe(false)
    })
  })
})
